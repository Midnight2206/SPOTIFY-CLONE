import { store } from "../../store/store.js";
import { refreshLibrary } from "../../main.js";
import httpRequest from "../../utils/HttpRequest.js";
import NotifyToast from "../../components/toast/NotifyToast.js";

export class SideBar extends HTMLElement {
  constructor() {
    super();
    this.createPlaylist = this.createPlaylist.bind(this);
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

  async connectedCallback() {
    await this.loadHtmlWithCss("components/sideBar/sideBar.html", this);
    this.classList.add("sidebar");

    this.createPlaylistBtn = this.querySelector("button.create-btn");
    if (this.createPlaylistBtn) {
      this.createPlaylistBtn.addEventListener("click", this.createPlaylist);
    }
  }

  disconnectedCallback() {
    if (this.createPlaylistBtn) {
      this.createPlaylistBtn.removeEventListener("click", this.createPlaylist);
      this.createPlaylistBtn = null;
    }
  }

  async createPlaylist() {
    if (!store.user) {
      NotifyToast.show({
        message: "Please log in to create a playlist",
        type: "warn",
        duration: 3000,
      });
      store.authModal_status = "open";
      store.authModal_form = "login";
      return;
    }

    try {
      const res = await httpRequest.post("playlists", {
        name: "New Playlist",
        description: "My new playlist",
      });

      if (res.playlist) {
        refreshLibrary()
      }

      NotifyToast.show({
        message: res.message || "Playlist created successfully!",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      NotifyToast.show({
        message: error.message || "Failed to create playlist",
        type: "fail",
        duration: 3000,
      });
    }
  }
}

customElements.define("side-bar", SideBar);
