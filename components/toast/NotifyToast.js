// NotifyToast.js
class NotifyToast {
  static container = null;

  static init() {
    if (this.container) return;

    // Tạo container
    this.container = document.createElement("div");
    this.container.className = "notify-toast-container";
    document.body.appendChild(this.container);

    // Inject CSS
    const style = document.createElement("style");
    style.textContent = `
      .notify-toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 9999;
      }
      .notify-toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 250px;
        max-width: 350px;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.95rem;
        color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease forwards;
        position: relative;
        overflow: hidden;
      }
      .notify-toast i {
        flex-shrink: 0;
        font-size: 1.2rem;
      }
      .notify-toast.success { background: #28a745; }
      .notify-toast.fail { background: #dc3545; }
      .notify-toast.warn { background: #ffc107; color: black; }
      .notify-toast.info { background: #17a2b8; }
      .notify-toast .close-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: inherit;
        font-size: 1rem;
        cursor: pointer;
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideOut {
        to { opacity: 0; transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }

  static show({message = "", type = "info", duration = 4000}) {
    this.init();

    const toast = document.createElement("div");
    toast.className = `notify-toast ${type}`;

    const iconMap = {
      success: "fa-check-circle",
      fail: "fa-times-circle",
      warn: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };

    toast.innerHTML = `
      <i class="fas ${iconMap[type] || iconMap.info}"></i>
      <span>${message}</span>
      <button class="close-btn">&times;</button>
    `;

    // Đóng khi click
    toast.querySelector(".close-btn").onclick = () => this._removeToast(toast);

    // Tự đóng sau duration
    if (duration > 0) {
      setTimeout(() => this._removeToast(toast), duration);
    }

    this.container.appendChild(toast);
  }

  static _removeToast(toast) {
    toast.style.animation = "slideOut 0.3s ease forwards";
    toast.addEventListener("animationend", () => toast.remove());
  }
}

export default NotifyToast;
