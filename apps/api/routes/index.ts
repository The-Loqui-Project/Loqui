import APIRoute from "./route";

// API v1
// OAuth
import V1_OAuthFinalize from "./v1/oauth/finalize";
import V1_OAuthConfiguration from "./v1/oauth/configuration";

// Languages
import V1_LanguagesAll from "./v1/languages/all";

// Projects
import V1_ProjectManagementOptIn from "./v1/projects/management/opt-in";
import V1_ProjectManagementOptOut from "./v1/projects/management/opt-out";
import V1_ProjectManagementUserProjects from "./v1/projects/management/user-projects";
import V1_ProjectGetStrings from "./v1/projects/[id]/strings";
import V1_ProjectGetString from "./v1/projects/[id]/string/[id]";
import V1_ProjectGetProgress from "./v1/projects/[id]/progress";
import V1_ProjectReport from "./v1/projects/[id]/report";
import V1_ProjectsAll from "./v1/projects/all";
import V1_ProjectsUser from "./v1/projects/user";

// Proposals
import V1_ProposalCreate from "./v1/proposals/create";
import V1_ProposalVote from "./v1/proposals/vote";
import V1_ProposalApprove from "./v1/proposals/approve";
import V1_ProposalDispute from "./v1/proposals/dispute";
import V1_ProposalDelete from "./v1/proposals/delete";
import V1_ProposalReport from "./v1/proposals/report";
import V1_StringReport from "./v1/proposals/report-string";
import V1_ProposalsList from "./v1/proposals/list";
import V1_ProposalEdit from "./v1/proposals/edit";
import V1_TranslationsCreate from "./v1/translations/create";

// Reports Management
import V1_ReportsList from "./v1/proposals/reports/list";
import V1_ReportsResolve from "./v1/proposals/reports/resolve";

// Tasks
import V1_TasksList from "./v1/tasks/list";
import V1_TasksGet from "./v1/tasks/get";

interface RouteStorage {
  [apiVersion: string]: {
    [routeName: string]: APIRoute;
  };
}

const routes: RouteStorage = {
  v1: {
    // Authentication
    oauth_finalize: V1_OAuthFinalize,
    oauth_configuration: V1_OAuthConfiguration,

    // Languages
    languages_all: V1_LanguagesAll,

    // Projects
    project_management_opt_in: V1_ProjectManagementOptIn,
    project_management_opt_out: V1_ProjectManagementOptOut,
    project_management_user_projects: V1_ProjectManagementUserProjects,
    project_get_strings: V1_ProjectGetStrings,
    project_get_string: V1_ProjectGetString,
    project_get_progress: V1_ProjectGetProgress,
    project_report: V1_ProjectReport,
    projects_all: V1_ProjectsAll,
    projects_user: V1_ProjectsUser,

    // Proposals
    proposal_create: V1_ProposalCreate,
    proposal_vote: V1_ProposalVote,
    proposal_approve: V1_ProposalApprove,
    proposal_dispute: V1_ProposalDispute,
    proposal_delete: V1_ProposalDelete,
    proposal_report: V1_ProposalReport,
    proposal_edit: V1_ProposalEdit,
    string_report: V1_StringReport,
    proposals_list: V1_ProposalsList,
    translation_create: V1_TranslationsCreate,

    // Reports Management
    reports_list: V1_ReportsList,
    reports_resolve: V1_ReportsResolve,

    // Tasks
    tasks_list: V1_TasksList,
    tasks_get: V1_TasksGet,
  },
};

export default routes;
