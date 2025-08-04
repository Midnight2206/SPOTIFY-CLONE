import { store, subscribe } from "../../store/store.js";
export default class Header extends HTMLElement {
  constructor() {
    super();

    this.handleClickAuthBtns = this.handleClickAuthBtns.bind(this);
    this.renderUser = this.renderUser.bind(this);
    this.showDropdown = this.showDropdown.bind(this);
  }
  async connectedCallback() {
    const res = await fetch(`components/header/header.html`);
    const html = await res.text();
    this.innerHTML = html;
    this.headerTag = this.querySelector("header");
    this.avatarImg = this.querySelector("#userAvatar img");
    this.displayName = this.querySelector(".user-displayname");
    this.userDropdown = this.querySelector("#userDropdown");
    this.authbBtns = this.querySelector(".auth-buttons");
    this.authbBtns.addEventListener("click", this.handleClickAuthBtns);
    this.unsubUser = subscribe("user", (user) => this.renderUser(user));
    this.renderUser(store.user);
  }
  async disconnectedCallback() {}
  handleClickAuthBtns(e) {
    if (e.target.closest(".auth-btn.signup-btn")) {
      store.authModal_status = "open";
      store.authModal_form = "signup";
    }
    if (e.target.closest(".auth-btn.login-btn")) {
      store.authModal_status = "open";
      store.authModal_form = "login";
    }
  }
  renderUser(user) {
    if (user) {
      this.headerTag.classList.add("logged-in");
      this.avatarImg.src = user.avatar || `placeholder.svg?height=32&width=32`;
      this.displayName.textContent = user.display_name || "User";
      document.addEventListener("click", this.showDropdown);
    } else {
      this.headerTag.classList.remove("logged-in");
      document.removeEventListener("click", this.showDropdown);
    }
  }
  showDropdown(e) {
    if (e.target.closest("#userAvatar")) {
      this.userDropdown.classList.toggle("show");
    } else {
      if(!e.target.closest(".user-menu")) {
        this.userDropdown.classList.remove("show");
      }
    }
  }
}
customElements.define("spotify-header", Header);
