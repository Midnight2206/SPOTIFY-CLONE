import { store, subscribe } from "../../store/store.js";
import { navigate } from "../../router.js";
import { queueActions } from "../../store/queueActions.js";
import { resetAuth } from "../../utils/refreshToken.js";
import { preloadImage } from "../../utils/preloadImage.js";

export default class Header extends HTMLElement {
  constructor() {
    super();
    this.unsubscribes = [];

    this.handleClickAuthBtns = this.handleClickAuthBtns.bind(this);
    this.renderUser = this.renderUser.bind(this);
    this.showDropdown = this.showDropdown.bind(this);
    this.handleLogoutBtn = this.handleLogoutBtn.bind(this);
  }

  async loadHtmlWithCss(url, targetEl) {
    const res = await fetch(url);
    let html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const links = [...doc.querySelectorAll('link[rel="stylesheet"]')];

    const styles = await Promise.all(
      links.map(async (link) => {
        const href = link.getAttribute("href");
        try {
          const resCss = await fetch(href);
          const css = await resCss.text();
          return `<style>\n${css}\n</style>`;
        } catch (err) {
          console.error("Không tải được CSS:", href, err);
          return "";
        }
      })
    );

    const stylesBlock = styles.join("\n");
    links.forEach((link) => link.remove());
    html = stylesBlock + doc.body.innerHTML;

    targetEl.innerHTML = html;
  }

  waitForUser() {
    return new Promise((resolve) => {
      if (store.user) return resolve(store.user);
      const unsub = subscribe("user", (u) => {
        if (u) {
          unsub()
          resolve(u);
        }
      });
    });
  }

  async connectedCallback() {
    await this.loadHtmlWithCss(`components/header/header.html`, this);

    this.classList.add("header");
    this.headerTag = this.querySelector("header");
    this.avatarImg = this.querySelector("#userAvatar img");
    this.displayName = this.querySelector(".user-displayname");
    this.userDropdown = this.querySelector("#userDropdown");
    this.logoutBtn = this.userDropdown.querySelector("#logoutBtn");
    this.authbBtns = this.querySelector(".auth-buttons");

    this.authbBtns.addEventListener("click", this.handleClickAuthBtns);

    const unsubUser = subscribe("userId", () => this.renderUser(store.user));
    this.unsubscribes.push(unsubUser);

  
    await this.renderUser(store.user);
    

    const user = await this.waitForUser();
    await this.renderUser(user);
  }

  disconnectedCallback() {
    this.unsubscribes.forEach((unsub) => unsub());
    this.unsubscribes = [];

    if (this.authbBtns) {
      this.authbBtns.removeEventListener("click", this.handleClickAuthBtns);
    }
    document.removeEventListener("click", this.showDropdown);

    this.headerTag = null;
    this.avatarImg = null;
    this.displayName = null;
    this.userDropdown = null;
    this.logoutBtn = null;
    this.authbBtns = null;
  }

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

  async renderUser(user) {
    if (user) {
      this.headerTag.classList.add("logged-in");
      await preloadImage(
        user.avatar_url || `placeholder.svg?height=32&width=32`,
        this.avatarImg,
        `placeholder.svg?height=32&width=32`
      );
      this.displayName.textContent = user.display_name || "User";
      document.addEventListener("click", this.showDropdown);
    } else {
      this.headerTag.classList.remove("logged-in");
      document.removeEventListener("click", this.showDropdown);
    }
  }

  showDropdown(e) {
    if (e.target.closest("#userAvatar")) {
      if (this.userDropdown.classList.contains("show")) {
        this.userDropdown.classList.remove("show");
        this.logoutBtn.removeEventListener("click", this.handleLogoutBtn);
      } else {
        this.userDropdown.classList.add("show");
        this.logoutBtn.addEventListener("click", this.handleLogoutBtn);
      }
    } else if (!e.target.closest(".user-menu")) {
      this.userDropdown.classList.remove("show");
    }
  }

  handleLogoutBtn() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    resetAuth();
    this.userDropdown.classList.remove("show");
    queueActions.clearQueue()
    navigate("/")
  }
}

customElements.define("spotify-header", Header);
