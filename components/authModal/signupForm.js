import { store, subscribe } from "../../store/store.js";
import validateInput from "../../utils/validateInput.js";
import httpRequest from "../../utils/HttpRequest.js";
export class SignupForm extends HTMLElement {
  constructor() {
    super();
    this.handleSwitch = this.handleSwitch.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  async connectedCallback() {
    const res = await fetch("/components/authModal/signupForm.html");
    const html = await res.text();
    this.innerHTML = html;
    this.classList.add("auth-form");
    this.id = "signupForm";
    this.inputs = this.querySelectorAll(".form-group input");
    this.inputs.forEach((input) => {
      input.addEventListener("input", this.handleInput);
    });
    this.authSwitchBtn = this.querySelector("#showLogin");
    this.authSwitchBtn.addEventListener("click", this.handleSwitch);
    this.form = this.querySelector("form");
    this.dispatchEvent(new CustomEvent("form-ready", { bubbles: true }));
    this.form.addEventListener("submit", this.handleSubmit);
  }
  disconnectedCallback() {
    this.inputs?.forEach((input) => {
      input.removeEventListener("input", this.handleInput);
    });
    this.authSwitchBtn?.removeEventListener("click", this.handleSwitch);
    this.form?.removeEventListener("submit", this.handleSubmit);
    this.form?.reset();
    this.formData = null;
  }
  handleSwitch() {
    store.authModal_form = "login";
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
      .post("auth/register", this.formData, { skipAuth: true })
      .then((res) => {
        if (res.status === 201) {
          store.authModal_status = "close";
          store.authModal_form = "login";
          localStorage.setItem("token", res.access_token);
          localStorage.setItem("refreshToken", res.refresh_token);
          store.user = res.user;
        } else {
          alert(res.message || "Signup failed. Please try again.");
        }
      })
      .catch((error) => {
        this.handleServerError(error);
      });
  }
  handleServerError(err) {
    if (err.code === "EMAIL_EXISTS") {
      const emailInput = this.querySelector("#signupEmail");
      const emailGroup = emailInput.parentElement;
      const errorMessage = emailGroup.querySelector(".error-message span");
      emailGroup.classList.add("invalid");
      errorMessage.textContent = err.message || "Email already exists.";
    } else {
      alert(err.message || "An error occurred. Please try again.");
    }
  }
}

customElements.define("signup-form", SignupForm);
