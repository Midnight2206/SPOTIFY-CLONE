import NotifyToast from "../components/toast/NotifyToast.js";

// Bộ nhớ đệm ảnh (cache theo URL)
const imageCache = new Map();

// Ảnh placeholder mặc định (154x154, bạn có thể đổi link này)
const DEFAULT_PLACEHOLDER = "placeholder.svg";

/**
 * Preload ảnh với cache và fallback khi lỗi
 * @param {string} url - Link ảnh gốc
 * @param {HTMLImageElement} targetImg - Thẻ <img> cần set src
 * @param {string} [fallback] - Link ảnh fallback (nếu không truyền dùng mặc định)
 * @returns {Promise<string>} - Trả về URL cuối cùng được set
 */
export function preloadImage(url, targetImg, fallback = DEFAULT_PLACEHOLDER) {
  return new Promise((resolve, reject) => {
    // Nếu không có URL => set fallback ngay
    if (!url) {
      targetImg.src = fallback;
      NotifyToast.show({
        message: "Không tìm thấy ảnh",
        type: "fail",
        duration: 3000
      });
      return reject(new Error("No URL provided"));
    }

    // Nếu ảnh đã có trong cache
    if (imageCache.has(url)) {
      const { finalSrc, status } = imageCache.get(url);
      targetImg.src = finalSrc;
      return status === "success"
        ? resolve(finalSrc)
        : reject(new Error(`Image previously failed: ${url}`));
    }

    // Load ảnh mới
    const tempImg = new Image();

    tempImg.onload = () => {
      imageCache.set(url, { status: "success", finalSrc: url });
      targetImg.src = url;
      resolve(url);
    };

    tempImg.onerror = () => {
      imageCache.set(url, { status: "fail", finalSrc: fallback });
      targetImg.src = fallback;
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
