// filepath: /workspaces/Loqui/apps/api/util/auth-utils.ts
import { FastifyReply, FastifyRequest } from "fastify";
import validateModrinthToken from "./auth";
import db from "../db";
import { user } from "../db/schema/schema";
import { User } from "typerinth/dist/interfaces/users";

// User roles in hierarchy (low to high)
const ROLE_HIERARCHY = ["translator", "approved", "moderator", "admin"];

export interface AuthUser {
  id: string;
  role: string;
  isBanned: boolean;
  reputation: number;
  modrinthUser?: User;
}

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
}
