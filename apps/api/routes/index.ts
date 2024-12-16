import APIRoute from "./route";
import V1OAuthTestRoute from "./v1/oauth/test";

interface RouteStorage {
  [apiVersion: string]: {
    [routeName: string]: APIRoute;
  };
}

const routes: RouteStorage = {
  v1: {
    oauth_test: V1OAuthTestRoute,
  },
};

export default routes;
