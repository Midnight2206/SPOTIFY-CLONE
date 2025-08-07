import { store } from "../store/store.js";
import httpRequest from "./HttpRequest.js";
import { refreshToken, resetAuth } from "./refreshToken.js";
export async function getUser(retried = false) {
  try {
    const response = await httpRequest.get("users/me");
    if (response.status === 200) {
      store.user = response.user;
      store.userId = response.user.id;
      store.stats = response.stats;
    }
  } catch (error) {
    if (error.code === "INVALID_TOKEN" && !retried) {
      const isRefreshed = await refreshToken();
      if (isRefreshed) {
        return getUser(true);
      } else {
        resetAuth();
      }
    } else {
        console.error("Error fetching user data:", error);
        resetAuth();
    }
  }
}
