const routes = [];

// Đăng ký route
export function addRoute(path, render) {
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, key) => {
        paramNames.push(key);
        return "([^/]+)";
    });
    const regex = new RegExp(`^${regexPath}$`);
    routes.push({ regex, render, paramNames });
}

// Chuyển trang thủ công
export function navigate(path) {
    location.hash = path.startsWith("#") ? path : "#" + path;
}

// Lấy URL hiện tại (bỏ dấu #)
function getCurrentPath() {
    return location.hash.slice(1) || "/";
}
export function reload() {
    window.dispatchEvent(new Event("hashchange"));
}


// Khởi chạy router
export function initRouter() {
    function handleRoute() {
        const path = getCurrentPath();
        for (const route of routes) {
            const match = path.match(route.regex);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                route.render({ params });
                return;
            }
        }
        console.warn("No route matched:", path);
    }
    handleRoute()
    window.addEventListener("hashchange", handleRoute);
    window.addEventListener("load", handleRoute);
}
