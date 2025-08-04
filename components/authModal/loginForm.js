import { store, subscribe } from "../../store/store.js";
import validateInput from "../../utils/validateInput.js";
import httpRequest from "../../utils/HttpRequest.js";
import { getUser } from "../../utils/getUser.js";
export class LoginForm extends HTMLElement {
  constructor() {
    super();
    this.handleSwitch = this.handleSwitch.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleServerError = this.handleServerError.bind(this);
  }

  async connectedCallback() {
    const res = await fetch("components/authModal/loginForm.html");
    const html = await res.text();
    this.innerHTML = html;
    this.classList.add("auth-form");
    this.id = "loginForm";
    this.authSwitchBtn = this.querySelector("#showSignup");
    this.form = this.querySelector("form");
    this.form.addEventListener("submit", this.handleSubmit);
    this.dispatchEvent(new CustomEvent("form-ready", { bubbles: true }));
    this.inputs = this.querySelectorAll(".form-group input");
    this.inputs.forEach((input) => {
      input.addEventListener("input", this.handleInput);
    });
    this.authSwitchBtn.addEventListener("click", this.handleSwitch);
  }
  handleSwitch() {
    store.authModal_form = "signup";
  }
  handleInput(e) {
    const input = e.target;
    validateInput(input);
  }
  handleSubmit(e) {
    e.preventDefault();
    this.inputs.forEach((input) => {
      validateInput(input);
    });
    const invalidFilelds = this.querySelectorAll(".form-group.invalid");
    if (invalidFilelds.length > 0) return;
    const formData = new FormData(this.form);
    this.formData = Object.fromEntries(formData.entries());
    httpRequest
      .post("auth/login", this.formData, { skipAuth: true })
      .then(async (res) => {
        if (res.status === 200) {
          store.authModal_status = "close";
          localStorage.setItem("token", res.access_token);
          localStorage.setItem("refreshToken", res.refresh_token);
          await getUser();
        }
      })
      .catch((error) => {
        this.handleServerError(error);
      });
  }
  handleServerError(error) {
    if (error.code === "INVALID_CREDENTIALS") {
      const emailInput = this.querySelector("#loginEmail");
      const emailGroup = emailInput.parentElement;
      const errorMessages = this.form.querySelectorAll(".error-message span");
      const passwordInput = this.querySelector("#loginPassword");
      const passwordGroup = passwordInput.parentElement;
      emailGroup.classList.add("invalid");
      passwordGroup.classList.add("invalid");
      passwordInput.value = "";
      errorMessages.forEach((msg) => {
        msg.textContent = error.message || "Invalid email or password.";
      });
    }
  }
}

customElements.define("login-form", LoginForm);
