export class SideBar extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const res = await fetch("components/sideBar/sideBar.html");
    const html = await res.text();
    this.innerHTML = html;
    const signupBtn = document.querySelector(".signup-btn");
    const loginBtn = document.querySelector(".login-btn");
  }
  async getPlayList(id) {}
}

customElements.define("side-bar", SideBar);
