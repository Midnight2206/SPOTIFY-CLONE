import httpRequest from "./HttpRequest.js"
import { store } from "../store/store.js";
export async function refreshToken() {
  try {
    const refresh_token = localStorage.getItem("refreshToken");
    if (refresh_token) {
      const res = await httpRequest.post("auth/refresh-token", null, {
        skipAuth: true,
        headers: {
          Authorization: `Bearer ${refresh_token}`,
        },
      });
      if (res.status === 200) {
        localStorage.setItem("token", res.access_token);
        return true;
      }
    }
  } catch (error) {
     if (error.code === "INVALID_TOKEN" || error.code === 401) {
      resetAuth();
    } else {
      console.error(error);
    }
    return false;
  }
}
export function resetAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    store.user = null;
    store.stats = null;
    store.userId = null;
    store.authModal_status = "close";
    store.authModal_form = "login";
    store.myPlaylists = null;
    store.viewModePlaylist = "list-default";
  }