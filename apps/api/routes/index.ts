import APIRoute from "./route";

/// API v1
// OAuth
import V1_OAuthFinalize from "./v1/oauth/finalize";
import V1_OAuthConfiguration from "./v1/oauth/configuration";

// Projects
import V1_ProjectManagementSubmit from "./v1/projects/management/submit";
import V1_ProjectGetStrings from "./v1/projects/[id]/strings";
import V1_ProjectGetString from "./v1/projects/[id]/string/[id]";
import V1_ProjectReport from "./v1/projects/[id]/report";

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

    // Projects
    project_management_submit: V1_ProjectManagementSubmit,
    project_get_strings: V1_ProjectGetStrings,
    project_get_string: V1_ProjectGetString,
    project_report: V1_ProjectReport,
  },
};

export default routes;
