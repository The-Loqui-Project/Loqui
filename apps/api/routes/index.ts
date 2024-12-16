import APIRoute from "./route";
import V1_OAuthFinalize from "./v1/oauth/finalize";

interface RouteStorage {
  [apiVersion: string]: {
    [routeName: string]: APIRoute;
  };
}

const routes: RouteStorage = {
  v1: {
    oauth_test: V1_OAuthFinalize,
  },
};

export default routes;
