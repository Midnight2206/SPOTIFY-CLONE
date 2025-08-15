import NotifyToast from "../components/toast/NotifyToast.js";

const imageCache = new Map(); 
/**
 * Preload image with caching (load once only).
 * @param {string} url - Image URL
 * @param {HTMLImageElement} targetImg - Target <img> element
 * @param {string} [fallback] - Optional fallback image URL if load fails
 * @returns {Promise<string>} Resolves with final URL set to img
 */
export function preloadImage(url, targetImg, fallback) {
  return new Promise((resolve, reject) => {
    if (!url) {
      const finalSrc = fallback || "";
      targetImg.src = finalSrc;
      NotifyToast.show({
        message: "Tải ảnh thất bại",
        type: "fail",
        duration: 3000
      });
      return reject(new Error("No URL provided"));
    }

    if (imageCache.has(url)) {
      const { finalSrc, status } = imageCache.get(url);
      targetImg.src = finalSrc;
      return status === "success" ? resolve(finalSrc) : reject(new Error(`Image previously failed: ${url}`));
    }

    const tempImg = new Image();
    tempImg.onload = () => {
      imageCache.set(url, { status: "success", finalSrc: url });
      targetImg.src = url;
      resolve(url);
    };

    tempImg.onerror = () => {
      const finalSrc = fallback || "";
      imageCache.set(url, { status: "fail", finalSrc });
      targetImg.src = finalSrc;
      NotifyToast.show({
        message: "Tải ảnh thất bại",
        type: "fail",
        duration: 3000
      });
      reject(new Error(`Failed to load image: ${url}`));
    };

    tempImg.src = url;
  });
}
