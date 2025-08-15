import httpRequest from "../../../utils/HttpRequest.js";
import NotifyToast from "../../toast/NotifyToast.js";
import { store } from "../../../store/store.js";
import { navigate, reload } from "../../../router.js";
export class Playlist extends HTMLElement {
  constructor() {
    super();
    this.toggleModal = this.toggleModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.getPlaylistData = this.getPlaylistData.bind(this);
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
    this.handleChooseImg = this.handleChooseImg.bind(this);
    this.handleMenuAction = this.handleMenuAction.bind(this);
  }
  async connectedCallback() {
    this.playlist = await this.getPlaylistData();
    const html = `
      <link rel="stylesheet" href="components/pages/playlist/playlist.css" />
      <section class="playlist-hero">
        <div class="hero-background">
          <div class="hero-image">
            <img src="${this.playlist.image_url || "placeholder.svg"}" alt="" />
          </div>
          <div class="playlist-info">
            <span class="playlist-public">${
              this.playlist.is_public ? "Public Playlist" : "Private Playlist"
            }</span>
            <h2 class="playlist-name">${this.playlist.name}</h2>
            <span class="playlist-detail">${this.playlist.description}</span>
            <span class="playlist-detail">${this.playlist.user_display_name}, ${
      this.playlist.total_tracks
    } songs, ${this.playlist.total_duration}
            </span>
          </div>
        </div>
      </section>

      <!-- playlist Controls -->
      <section class="playlist-controls">
        <div class="left-controls">
          <button class="play-btn-large">
            <i class="fas fa-play"></i>
          </button>
          <button class="controls-menu-btn">
            <i class="fa-solid fa-ellipsis"></i>
          </button>
          <ul class="controls-menu">
            <li class="controls-menu-item">Delete</li>
            <li class="controls-menu-item">Details</li>
            <li class="controls-menu-item">${
              this.playlist.is_public ? "Make Private" : "Make Public"
            }</li>
          </ul>
        </div>
        <div class="right-controls">
          <button class="controls-menu-btn">
            <span>Compact</span>
            <i class="fa-solid fa-bars"></i>
          </button>
          <ul class="controls-menu">
            <li class="controls-menu-item">
              <i class="fa-solid fa-bars"></i>
              Compact
            </li>
            <li class="controls-menu-item">
              <i class="fa-solid fa-list"></i>
              List
            </li>
          </ul>
        </div>
      </section>

      <!-- Popular Tracks -->
      <section class="popular-section">
        <h2 class="section-title">Popular</h2>
        <div class="track-list">
          <div class="track-item">
            <div class="track-number">1</div>
            <div class="track-image">
              <img
                src="placeholder.svg?height=40&width=40"
                alt="Cho Tôi Lang Thang"
              />
            </div>
            <div class="track-info">
              <div class="track-name">Cho Tôi Lang Thang</div>
            </div>
            <div class="track-plays">27,498,341</div>
            <div class="track-duration">4:18</div>
            <button class="track-menu-btn">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>

          <div class="track-item playing">
            <div class="track-number">
              <i class="fas fa-volume-up playing-icon"></i>
            </div>
            <div class="track-image">
              <img src="placeholder.svg?height=40&width=40" alt="Lối Nhỏ" />
            </div>
            <div class="track-info">
              <div class="track-name playing-text">Lối Nhỏ</div>
            </div>
            <div class="track-plays">45,686,866</div>
            <div class="track-duration">4:12</div>
            <button class="track-menu-btn">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>

          <div class="track-item">
            <div class="track-number">3</div>
            <div class="track-image">
              <img src="placeholder.svg?height=40&width=40" alt="Cho Minh Em" />
            </div>
            <div class="track-info">
              <div class="track-name">Cho Minh Em</div>
            </div>
            <div class="track-plays">20,039,024</div>
            <div class="track-duration">3:26</div>
            <button class="track-menu-btn">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>
        </div>
      </section>
      <div class="playlist-modal-overlay">
        <div class="playlist-modal-container">
          <h2 class="playlist-modal-title">Edit details</h2>
          <button class="playlist-modal-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <form class="playlist-modal-content">
            <input name="image_file" type="file" id="choose-img" accept="image/*" />
            <label for="choose-img" class="choose-photo">
              <img class="preview-img" src="${
                this.playlist.image_url || ""
              }" alt="Preview" />
              <div class="placeholder">
                <i class="fa-solid fa-music"></i>
                <span>choose photo</span>
              </div>
            </label>
            <input type="text" name="name" value = "${
              this.playlist.name
            }" class="playlist-name-input" placeholder="Name of playlist" />
            <textarea name="description" class="playlist-des-input" placeholder="Description of playlist">${
              this.playlist.description
            }</textarea>
            <button class="btn playlist-submit">Save</button>
            <p class="playlist-modal-footer">
              By proceeding, you agree to give Spotify access to the image you choose
              to upload. Please make sure you have the right to upload the image.
            </p>
          </form>
        </div>
      </div>
    `;
    this.innerHTML = html;
    this.classList.add("content-wrapper");
    this.playlistModal = this.querySelector(".playlist-modal-overlay");
    this.playlistModalForm = this.querySelector(".playlist-modal-content");
    this.labelImg = this.querySelector(".choose-photo");
    const menuBtns = this.querySelectorAll(".controls-menu-btn");
    menuBtns.forEach((btn) => {
      btn.addEventListener("click", this.toggleMenu.bind(this));
    });

    this.inputFile = this.playlistModalForm.querySelector(
      'input[name="image_file"]'
    );
    this.inputFile.addEventListener("input", this.handleChooseImg);
    this.playlistHero = this.querySelector(".playlist-hero");
    this.playlistHero.addEventListener("click", this.toggleModal);
  }
  disconnectedCallback() {}
  async getPlaylistData() {
    const res = await httpRequest.get(`playlists/${this.playlistId}`);
    return res;
  }
  toggleModal() {
    if (!this.playlistModal.classList.contains("show")) {
      this.openModal();
    } else {
      this.closeModal();
    }
  }
  openModal() {
    this.playlistModal.classList.add("show");
    this.playlistModal.addEventListener("click", this.handleCloseModal);
    this.playlistModalForm.addEventListener("submit", this.handleSubmitForm);
  }
  handleCloseModal(e) {
    const target = e.target;
    if (
      target.closest(".playlist-modal-close") ||
      !target.closest(".playlist-modal-container")
    )
      this.closeModal();
  }
  closeModal() {
    this.playlistModalForm.removeEventListener("submit", this.handleSubmitForm);
    this.playlistModal.removeEventListener("click", this.handleCloseModal);
    this.playlistModal.classList.remove("show");
  }
  handleChooseImg(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const previewImg = this.querySelector(".choose-photo .preview-img");
      if (previewImg) {
        previewImg.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  }
  async handleSubmitForm(e) {
    e.preventDefault();

    const imageFile = this.inputFile.files[0];
    const formData = new FormData(this.playlistModalForm);
    const uploadImgData = new FormData();
    uploadImgData.append("cover", imageFile);

    const payload = {};
    if (formData.get("name") !== this.playlist.name) {
      payload.name = formData.get("name");
    }
    if (formData.get("description") !== this.playlist.description) {
      payload.description = formData.get("description");
    }
    try {
      if (imageFile) {
        const res = await httpRequest.post(
          `upload/playlist/${this.playlistId}/cover`,
          uploadImgData
        );
        if (res.status === 200) {
          payload.image_url = `https://spotify.f8team.dev${res.file.url}`;
        }
      }
      if (Object.keys(payload).length === 0) {
        NotifyToast.show({
          message: "Không có gì để thay đổi",
          type: "info",
          duration: 3000,
        });
      } else {
        const response = await httpRequest.put(
          `playlists/${this.playlistId}`,
          payload
        );
        if (response.status === 200 && response.playlist) {
          const updatedPlaylist = response.playlist;
          store.libraryData = store.libraryData.map((item) => {
            if (item.id === updatedPlaylist.id) {
              item.name = updatedPlaylist.name;
              item.image_url = updatedPlaylist.image_url;
              item.description = updatedPlaylist.description;
              return item;
            } else {
              return item;
            }
          });
          NotifyToast.show({
            message: "Update playlist successfully",
            type: "success",
            duration: 3000,
          });
          this.closeModal();
          reload();
        }
      }
    } catch (error) {
      NotifyToast.show({
        message: error?.message || "Update playlist fail",
        type: "fail",
        duration: 3000,
      });
    }
  }
  toggleMenu(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const menu = btn.nextElementSibling;
    const allMenus = this.querySelectorAll(".controls-menu");

    allMenus.forEach((m) => {
      if (m !== menu) {
        m.classList.remove("show");
      }
    });
    menu.classList.toggle("show");
    document.addEventListener(
      "click",
      (event) => {
        if (!btn.contains(event.target)) {
          menu.classList.remove("show");
        }
        const menuItem = event.target.closest(".controls-menu-item");
        if (menuItem) {
          const action = menuItem.textContent.trim();
          if (action) this.handleMenuAction(action);
        }
      },
      { once: true }
    );
  }
  async handleMenuAction(action) {
    switch (action) {
      case "Delete":
        try {
          const res = await httpRequest.remove(`playlists/${this.playlistId}`);
          if (res.message) {
            NotifyToast.show({
              message: res.message,
              type: "success",
              duration: 3000,
            });
          }
          store.libraryData = store.libraryData.filter(
            (item) => item.id !== this.playlistId
          );

          navigate("/");
        } catch (error) {
          if (error.message) {
            NotifyToast.show({
              message: error.message,
              type: "fail",
              duration: 3000,
            });
          }
        }
        break;
      case "Details":
        this.openModal();
        break;
      case "Make Public":
      case "Make Private":
        try {
          const res = await httpRequest.put(`playlists/${this.playlistId}`, {
            is_public: !this.playlist.is_public,
          });
          const updatedPlaylist = res.playlist;
          store.libraryData = store.libraryData.map((item) => {
            if (item.id === updatedPlaylist.id) {
              item.is_public = updatedPlaylist.is_public
              return item;
            } else {
              return item;
            }
          });
          if (res.message) {
            NotifyToast.show({
              message: res.message,
              type: "success",
              duration: 3000,
            });
          }
          reload()
          
        } catch (error) {
          if (error.message) {
            NotifyToast.show({
              message: error.message,
              type: "fail",
              duration: 3000,
            });
          }
        }
        break;
    }
  }
}
customElements.define("spotify-playlist", Playlist);
