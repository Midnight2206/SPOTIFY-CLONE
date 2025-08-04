class HttpRequest {
  constructor() {
    this.baseURL = "https://spotify.f8team.dev/api/";
  }
  async _send(path, method, data, options = {}) {
    try {
      const token = localStorage.getItem("token");
      const _options = {
        method,
        ...options,
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
        },
      };
      if (token && !options.skipAuth) {
        _options.headers["Authorization"] = `Bearer ${token}`;
      }
      if (data) _options.body = JSON.stringify(data);
      const res = await fetch(`${this.baseURL}${path}`, _options);
      const response = await res.json();
      if (!res.ok) {
        const error = new Error(
          response?.error?.message || "Something went wrong"
        );
        error.code = response?.error?.code || res.status;
        throw error;
      }
      return {
        ...response,
        status: res.status,
      };
    } catch (error) {
      throw error;
    }
  }
  async get(path, options) {
    return await this._send(path, "GET", null, options);
  }
  async put(path, data, options) {
    return await this._send(path, "PUT", data, options);
  }
  async patch(path, data, options) {
    return await this._send(path, "PATCH", data, options);
  }
  async post(path, data, options) {
    return await this._send(path, "POST", data, options);
  }
  async remove(path, options) {
    return await this._send(path, "DELETE", null, options);
  }
}
const httpRequest = new HttpRequest();
export default httpRequest;
