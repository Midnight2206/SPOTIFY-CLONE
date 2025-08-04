import { store } from "/store/store.js";
import httpRequest from "/utils/HttpRequest.js";
import { refreshToken } from "/utils/refreshToken.js";
export async function getUser(retried = false) {
  try {
    const response = await httpRequest.get("users/me");
    if (response.status === 200) {
      store.user = response.user;
      store.stats = response.stats;
    }
  } catch (error) {
    if (error.code === "INVALID_TOKEN" && !retried) {
      const isRefreshed = await refreshToken();
      if (isRefreshed) {
        return getUser(true);
      } else {
        // Xử lý logout nếu không thể làm mới token
      }
    } else {
        console.error("Error fetching user data:", error);
        // Xử lý logout
    }
  }
}
