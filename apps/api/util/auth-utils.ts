import { FastifyReply, FastifyRequest } from "fastify";
import validateModrinthToken from "./auth";
import db from "../db";
import { user } from "../db/schema/schema";
import { User } from "typerinth/dist/interfaces/users";
import axios from "axios";
import TeamMember from "typerinth/dist/interfaces/teams/TeamMember";

// User roles in hierarchy (low to high)
const ROLE_HIERARCHY = ["translator", "approved", "moderator", "admin"];

export interface AuthUser {
  id: string;
  role: "translator" | "approved" | "moderator" | "admin";
  isBanned: boolean;
  reputation: number;
  modrinthUser?: User;
}

// Modrinth permission bit flags
export const ModrinthPermissions = {
  UPLOAD_VERSION: 1, // 1st bit
  DELETE_VERSION: 2, // 2nd bit
  EDIT_DETAILS: 4, // 3rd bit
  EDIT_BODY: 8, // 4th bit
  MANAGE_INVITES: 128, // 8th bit
  REMOVE_MEMBER: 256, // 9th bit
  EDIT_MEMBER: 512, // 10th bit
  DELETE_PROJECT: 1024, // 11th bit
  VIEW_ANALYTICS: 2048, // 12th bit
  VIEW_PAYOUTS: 4096, // 13th bit
};

export class AuthUtils {
  /**
   * Authenticate a user from the request and optionally get their database record
   * @param request - The FastifyRequest object
   * @param response - The FastifyReply object, used to send error responses
   * @param options - Options for authentication
   * @returns The authenticated user or undefined if authentication failed and response was sent
   */
  static async authenticateUser(
    request: FastifyRequest,
    response: FastifyReply,
    options: {
      requireDbUser?: boolean;
      createIfNotExists?: boolean;
    } = {},
  ): Promise<AuthUser | undefined> {
    const authorization = request.headers.authorization;
    if (!authorization) {
      response.status(401).send({
        message: "Unauthorized - Missing Modrinth Token",
      });
      return undefined;
    }

    // Validate Modrinth token
    const modrinthUser = await validateModrinthToken(authorization);
    if (!modrinthUser) {
      response.status(401).send({
        message: "Unauthorized - Invalid Modrinth Token",
      });
      return undefined;
    }

    // If we don't need the database user, just return the basic info
    if (!options.requireDbUser) {
      return {
        id: modrinthUser.id,
        role: "translator", // Default role
        isBanned: false,
        reputation: 1,
        modrinthUser,
      };
    }

    // Look up user in database
    let userData = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, modrinthUser.id),
    });

    // Create user if doesn't exist and requested
    if (!userData && options.createIfNotExists) {
      await db.insert(user).values({
        id: modrinthUser.id,
        role: "translator", // Default role
        reputation: 1,
      });

      userData = {
        id: modrinthUser.id,
        role: "translator",
        reputation: 1,
        banned: null,
      };
    }

    // If we still don't have a user record and it was required
    if (!userData) {
      response.status(404).send({
        message: "User not found",
      });
      return undefined;
    }

    // Check if user is banned
    if (userData.banned) {
      response.status(403).send({
        message: "User is banned",
      });
      return undefined;
    }

    return {
      id: userData.id,
      role: userData.role,
      isBanned: !!userData.banned,
      reputation: userData.reputation,
      modrinthUser,
    };
  }

  /**
   * Check if a user has the required role or higher
   * @param userRole - The user's role
   * @param requiredRole - The minimum required role
   */
  static hasRole(userRole: string, requiredRole: string): boolean {
    const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);

    if (userRoleIndex === -1 || requiredRoleIndex === -1) {
      return false;
    }

    return userRoleIndex >= requiredRoleIndex;
  }

  /**
   * Check if a user has sufficient permissions and send a 403 response if not
   * @param user - The authenticated user
   * @param response - The FastifyReply object
   * @param requiredRole - The minimum role required for this operation
   * @returns True if user has sufficient permissions, false otherwise
   */
  static async checkPermission(
    user: AuthUser,
    response: FastifyReply,
    requiredRole: string,
  ): Promise<boolean> {
    if (!this.hasRole(user.role, requiredRole)) {
      response.status(403).send({
        message: `Insufficient permissions. Requires ${requiredRole} role or higher.`,
      });
      return false;
    }
    return true;
  }

  /**
   * Parse an ID parameter from the request
   * @param request - The FastifyRequest object
   * @param response - The FastifyReply object
   * @param paramName - The name of the parameter to parse
   * @returns The parsed ID or undefined if parsing failed and response was sent
   */
  static parseIdParam(
    request: FastifyRequest,
    response: FastifyReply,
    paramName: string = "id",
  ): number | undefined {
    const params = request.params as Record<string, string>;
    const id = parseInt(params[paramName]);

    if (isNaN(id)) {
      response.status(400).send({
        message: `Invalid ${paramName} format`,
      });
      return undefined;
    }

    return id;
  }

  /**
   * Check if a user has the required permission for a Modrinth project
   * @param projectId - The Modrinth project ID
   * @param userId - The Modrinth user ID
   * @param authorization - The authorization header with Modrinth token
   * @param requiredPermission - The permission flag to check (from ModrinthPermissions)
   * @returns An object with the result of the permission check and any error message
   */
  static async checkModrinthProjectPermission(
    projectId: string,
    userId: string,
    authorization: string,
    requiredPermission: number,
  ): Promise<{
    hasPermission: boolean;
    errorMessage?: string;
    teamId?: string;
  }> {
    try {
      // Fetch project info to get team ID
      const projectResponse = await axios.get(
        `https://api.modrinth.com/v2/project/${projectId}`,
      );

      if (!projectResponse.data || !projectResponse.data.team) {
        return {
          hasPermission: false,
          errorMessage: `Failed to fetch project information for ${projectId}`,
        };
      }

      const teamId = projectResponse.data.team;

      // Get team members to check permissions
      const teamResponse = await axios.get(
        `https://api.modrinth.com/v2/team/${teamId}/members`,
        {
          headers: {
            Authorization: authorization,
          },
        },
      );

      if (!teamResponse.data || !Array.isArray(teamResponse.data)) {
        return {
          hasPermission: false,
          errorMessage: `Failed to fetch team information for project ${projectId}`,
        };
      }

      // Find the user in team members
      const userMember = teamResponse.data.find(
        (member: TeamMember) => member.user.id === userId,
      );

      if (!userMember) {
        return {
          hasPermission: false,
          errorMessage: `User is not a member of the team for project ${projectId}`,
        };
      }

      // Check if user has the required permission
      const hasPermission =
        (userMember.permissions & requiredPermission) === requiredPermission;

      return {
        hasPermission,
        teamId,
        errorMessage: hasPermission
          ? undefined
          : `User does not have the required permission for project ${projectId}`,
      };
    } catch (error) {
      console.error(
        `Error checking permission for project ${projectId}:`,
        error,
      );
      return {
        hasPermission: false,
        errorMessage: `Failed to check permissions for project ${projectId}`,
      };
    }
  }

  /**
   * Check permissions for multiple Modrinth projects
   * @param projectIds - Array of Modrinth project IDs
   * @param userId - The Modrinth user ID
   * @param authorization - The authorization header with Modrinth token
   * @param requiredPermission - The permission flag to check (from ModrinthPermissions)
   * @returns An object with arrays of authorized and unauthorized project IDs
   */
  static async checkModrinthProjectsPermissions(
    projectIds: string[],
    userId: string,
    authorization: string,
    requiredPermission: number,
  ): Promise<{
    authorizedProjects: string[];
    unauthorizedProjects: string[];
    projectInfos?: any[];
  }> {
    try {
      // Fetch projects information
      const idsString = '["' + projectIds.join('","') + '"]';
      const projectsResponse = await axios.get(
        "https://api.modrinth.com/v2/projects",
        {
          params: {
            ids: idsString,
          },
        },
      );

      if (!projectsResponse.data || !Array.isArray(projectsResponse.data)) {
        return {
          authorizedProjects: [],
          unauthorizedProjects: projectIds,
        };
      }

      const projectsInfos = projectsResponse.data;
      const authorizedProjects: string[] = [];
      const unauthorizedProjects: string[] = [];

      // Check permissions for each project
      for (const proj of projectsInfos) {
        const result = await this.checkModrinthProjectPermission(
          proj.id,
          userId,
          authorization,
          requiredPermission,
        );

        if (result.hasPermission) {
          authorizedProjects.push(proj.id);
        } else {
          unauthorizedProjects.push(proj.id);
        }
      }

      // Check for projects that weren't found in the API response
      const returnedProjectIds = new Set(projectsInfos.map((p: any) => p.id));
      const missingProjectIds = projectIds.filter(
        (id) => !returnedProjectIds.has(id),
      );

      return {
        authorizedProjects,
        unauthorizedProjects: [...unauthorizedProjects, ...missingProjectIds],
        projectInfos: projectsInfos,
      };
    } catch (error) {
      console.error("Error checking permissions for multiple projects:", error);
      return {
        authorizedProjects: [],
        unauthorizedProjects: projectIds,
      };
    }
  }
}
