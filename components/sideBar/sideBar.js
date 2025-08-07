import { store, subscribe } from "../../store/store.js";
import httpRequest from "../../utils/HttpRequest.js";
import NotifyToast from "../../components/toast/NotifyToast.js";
export class SideBar extends HTMLElement {
  constructor() {
    super();
    this.createPlaylist = this.createPlaylist.bind(this);
  }

  async connectedCallback() {
    const res = await fetch("components/sideBar/sideBar.html");
    const html = await res.text();
    this.innerHTML = html;
    this.classList.add("sidebar");
    this.createPlaylistBtn = this.querySelector("button.create-btn");
    this.createPlaylistBtn.addEventListener("click", this.createPlaylist);
  }
  async createPlaylist() {
    if (store.user) {
      try {
        const res = await httpRequest.post("playlists", {
          name: "New Playlist",
          description: "My new playlist",
        });
        if (res.playlist) {
          res.playlist.type = "playlist";
          store.libraryData = [res.playlist, ...store.libraryData];
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
        return;
      }
    } else {
      NotifyToast.show({
        message: "Please log in to create a playlist",
        type: "warn",
        duration: 3000,
      });
      store.authModal_status = "open";
      store.authModal_form = "login";
    }
  }
}

customElements.define("side-bar", SideBar);
