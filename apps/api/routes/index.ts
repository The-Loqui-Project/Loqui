import APIRoute from "./route";

/// API v1
// OAuth
import V1_OAuthFinalize from "./v1/oauth/finalize";
import V1_OAuthConfiguration from "./v1/oauth/configuration";

// Projects
import V1_ProjectManagementSubmit from "./v1/projects/management/submit";

interface RouteStorage {
  [apiVersion: string]: {
    [routeName: string]: APIRoute;
  };
}

const routes: RouteStorage = {
  v1: {
    oauth_finalize: V1_OAuthFinalize,
    oauth_configuration: V1_OAuthConfiguration,
    projects_management_submit: V1_ProjectManagementSubmit,
  },
};

export default routes;
