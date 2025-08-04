import { store, subscribe } from "/store/store.js";
import {DEPLOY_URL} from "/utils/constants.js";
export default class AuthModal extends HTMLElement {
  constructor() {
    super();
    this.close = this.close.bind(this);
    this.pressESC = this.pressESC.bind(this);
    this.clickOverlay = this.clickOverlay.bind(this);
    this.toggle = this.toggle.bind(this);
    this.renderForm = this.renderForm.bind(this);
  }
  async connectedCallback() {
    const res = await fetch(`${DEPLOY_URL}/components/authModal/authModal.html`);
    const html = await res.text();
    this.innerHTML = html;
    this.modal = this.querySelector("#authModal");
    this.modalContent = this.querySelector(".modal-content");
    this.modalLogo = document.createElement("div");
    this.modalLogo.classList.add("modal-logo");
    this.modalLogo.innerHTML = '<i class="fab fa-spotify"></i>';
    this.closeBtn = this.querySelector("#modalClose");
    this.modalContent.prepend(this.modalLogo);
    this.toggle(store.authModal_status);
    this.renderForm(store.authModal_form);
    this.unsubToggleModal = subscribe("authModal_status", this.toggle);
    this.unsubRenderForm = subscribe("authModal_form", this.renderForm);
  }
  disconnectedCallback() {
    this.close();
    this.unsubRenderForm?.();
    this.unsubToggleModal?.();
    this.closeBtn?.removeEventListener("click", this.close);
    document.removeEventListener("keydown", this.pressESC);
  }
  toggle(status) {
    const isOpen = status === "open";
    this.modal.classList.toggle("show", isOpen);

    if (isOpen) {
      this.modal.addEventListener("click", this.clickOverlay);
      document.addEventListener("keydown", this.pressESC);
      this.closeBtn.addEventListener("click", this.close);
    } else {
      this.modal.removeEventListener("click", this.clickOverlay);
      document.removeEventListener("keydown", this.pressESC);
      this.closeBtn.removeEventListener("click", this.close);
    }
  }
  close() {
    this.form?.reset();
    store.authModal_status = "close";
  }
  pressESC(e) {
    if (e.key === "Escape") {
      this.close();
    }
  }
  clickOverlay(e) {
    if (e.target === this.modal) {
      this.close();
    }
  }
  renderForm(form) {
    [...this.modalContent.children].forEach((child) => {
      if (child !== this.modalLogo) {
        child.remove();
      }
    });
    let formEl;
    this.form = null;
    if (form === "login") {
      formEl = document.createElement("login-form");
    } else if (form === "signup") {
      formEl = document.createElement("signup-form");
    }
    if (formEl) {
      formEl.addEventListener(
        "form-ready",
        () => {
          this.form = formEl.form;
        },
        { once: true }
      );

      this.modalContent.appendChild(formEl);
    }
  }
}
customElements.define("auth-modal", AuthModal);
