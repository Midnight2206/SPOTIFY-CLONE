import httpRequest from "../../../utils/HttpRequest.js";
import NotifyToast from "../../toast/NotifyToast.js";
import { store, subscribe, staticStoreUI } from "../../../store/store.js";
import { navigate, reload } from "../../../router.js";
export class Playlist extends HTMLElement {
  constructor() {
    super();
    this.cols = {
      status: "30px",
      title: "4fr",
      album: "2fr",
      date: "1fr",
      duration: "50px",
      menu: "30px",
    };
    this.toggleModal = this.toggleModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.getPlaylistData = this.getPlaylistData.bind(this);
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
    this.handleChooseImg = this.handleChooseImg.bind(this);
    this.handleMenuAction = this.handleMenuAction.bind(this);
    this.updateGrid = this.updateGrid.bind(this);
    this.renderSuggestTracks = this.renderSuggestTracks.bind(this)
    this.handleClickSuggestTracks = this.handleClickSuggestTracks.bind(this)
    this.addTrackToPlaylist = this.addTrackToPlaylist.bind(this)
    this.getTracksPlaylist = this.getTracksPlaylist.bind(this)
    this.renderTracksPlaylist = this.renderTracksPlaylist.bind(this)
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
            <span class="playlist-detail">
                ${this.playlist.user_display_name},
                ${this.playlist.total_tracks} songs,
                ${Math.trunc(this.playlist.total_duration / 60)}min ${this.playlist.total_duration % 60}sec
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
        <h3 class="playlist-controls-name">${this.playlist.name}</h3>
        <div data-compact=${staticStoreUI.playlist.viewModeTracksCompact} class="right-controls">
          <button class="controls-menu-btn">
            <span class="compact">Compact</span>
            <span class="list">List</span>
            <i class='fa-solid fa-bars compact'></i>
            <i class='fa-solid fa-list list'></i>            
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

      <section data-compact=${staticStoreUI.playlist.viewModeTracksCompact} class="playlist-tracks-section"></section>
      <!-- Tracks of Playlist -->
      <section class="suggest-tracks-section">
        <div class="suggest-tracks-header">
          <div>
            <h2 class="suggest-tracks-title">Suggest tracks</h2>
            <span class="suggest-tracks-decs">You may want to add to your playlist</span>
          </div>
          <button class="suggest-tracks-refresh">
            <i class="fa-solid fa-arrows-rotate"></i>
            Refresh
          </button>
        </div>
        <div class="suggest-tracks-list">
          
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
            <input type="text" name="name" value="${
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
    this.suggestTracksListEl = this.querySelector(".suggest-tracks-list")
    this.sectionPlaylistTracks = this.querySelector(
      "section.playlist-tracks-section"
    );
    const tracksPlaylist = await this.getTracksPlaylist()
    this.renderTracksPlaylist(tracksPlaylist)
    this.rightControls = this.querySelector(
      ".playlist-controls .right-controls"
    );
    const menuBtns = this.querySelectorAll(".controls-menu-btn");
    this.inputFile = this.playlistModalForm.querySelector(
      'input[name="image_file"]'
    );
    this.playlistHero = this.querySelector(".playlist-hero");
    this.scrollTop = parseInt(localStorage.getItem("playlistScrollY"), 10)
    this.updateGrid();
    const hero = this.querySelector(".playlist-hero");
    const controls = this.querySelector(".playlist-controls");
    const main = this.closest(".main-content");
    if (hero && controls && main) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            controls.classList.add("sticky-active");
          } else {
            controls.classList.remove("sticky-active");
          }
        },
        {
          root: main, // scroll container
          threshold: 0, // trigger ngay khi hero chạm top
          rootMargin: "-16px 0px 0px 0px", // bù padding top
        }
      );

      observer.observe(hero);
    }

    
    this.suggestTracksListEl.addEventListener("click", this.handleClickSuggestTracks)
    this.unsubTracks = subscribe("tracks", tracks => this.renderSuggestTracks(tracks))
    this.renderSuggestTracks(store.tracks)
    menuBtns.forEach((btn) => {
      btn.addEventListener("click", this.toggleMenu.bind(this));
    });
    this.inputFile.addEventListener("input", this.handleChooseImg);
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
          localStorage.setItem("playlistScrollY", this.scrollTop)

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
          if (action) this.handleMenuAction(action, menuItem);
        }
      },
      { once: true }
    );
  }
  async handleMenuAction(action, menuItem) {
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
              item.is_public = updatedPlaylist.is_public;
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
          localStorage.setItem("playlistScrollY", this.scrollTop)
          reload();
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
      case "List":
        staticStoreUI.playlist.viewModeTracksCompact = "false"
        this.sectionPlaylistTracks.dataset.compact = staticStoreUI.playlist.viewModeTracksCompact;
        this.rightControls.dataset.compact = staticStoreUI.playlist.viewModeTracksCompact;
        break;
      case "Compact":
        staticStoreUI.playlist.viewModeTracksCompact = "true"
        this.sectionPlaylistTracks.dataset.compact = staticStoreUI.playlist.viewModeTracksCompact;
        this.rightControls.dataset.compact = staticStoreUI.playlist.viewModeTracksCompact;
        break;
      case "Album":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.playlist.visibleCols.album =
          menuItem.dataset.choosed === "true" ? true : false;
        this.updateGrid();
        break;
      case "Date Added":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.playlist.visibleCols.date =
          menuItem.dataset.choosed === "true" ? true : false;
        this.updateGrid();
        break;
      case "Duration":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.playlist.visibleCols.duration =
          menuItem.dataset.choosed === "true" ? true : false;
        this.updateGrid();
        break;
      case "Remove from this playlist":
        try {
          const id = menuItem.dataset.trackid
          const res = await httpRequest.remove(`playlists/${this.playlistId}/tracks/${id}`)
          NotifyToast.show({message: res.message || "Removed from this playlist", type: "success", duration: 3000})
          localStorage.setItem("playlistScrollY", this.scrollTop)
          reload()
        } catch (error) {
          NotifyToast.show({message: error.message || "Have an error", type: "fail", duration: 3000})
        }
        break;
    }
  }
  renderTracksPlaylist(tracks) {
    if(tracks.length == 0) return
    const tracksPlaylistHTML = tracks.map((track, i) => (
      `
        <div class="track-grid track-row" data-playing="true">
          <div class="track-status">
            <span>${i+1}</span>
            <i class="fa-solid fa-play"></i>
          </div>
          <div class="track-title">
            <img
              class="track-img" 
              src="${track.track_image_url 
                      ? `https://spotify.f8team.dev${track.track_image_url}` 
                      : 'placeholder.svg'}" 
              alt="" 
            />
            <div class="track-info">
              <a class="track-name">${track.track_title}</a>
              <div class="track-artists">
                <a class="track-artist">${track.artist_name}</a>
              </div>
            </div>
          </div>
          <a class="track-album">${track.album_title}</a>
          <div class="track-date-added">${new Date(track.added_at).toLocaleDateString("vi-VN")}</div>
          <div class="track-duration"><span class="track-duration">
            ${String(Math.floor(track.track_duration / 60)).padStart(2, "0")}:${String(track.track_duration % 60).padStart(2, "0")}
          </span></div>
          <div class="last-column right-controls">
            <i class="fa-solid fa-ellipsis menu-icon controls-menu-btn"></i>
            <ul class="controls-menu lg-menu">
              <li class="controls-menu-item" data-trackid=${track.track_id}>Remove from this playlist</li>
              <li class="controls-menu-item">Save to your Liked songs</li>
            </ul>
          </div>
        </div>
      `
    )).join("")
    this.sectionPlaylistTracks.innerHTML = `
        <div class="tracks-pseudo-el"></div>
        <div class="track-grid playlist-tracks-header">
          <div class="tracks-header-item"><span>#</span></div>
          <div class="tracks-header-item"><span>Title</span></div>
          <div class="tracks-header-item"><span>Album</span></div>
          <div class="tracks-header-item"><span>Date Added</span></div>
          <div class="tracks-header-item">
            <span><i class="fa-solid fa-clock"></i></span>
          </div>
          <div class="last-column right-controls">
            <i class="fa-solid fa-caret-down menu-icon controls-menu-btn"></i>
            <ul class="controls-menu lg-menu space-between-menu">
              <li class="controls-menu-title">Columns</li>
              <li class="controls-menu-item" data-choosed="${staticStoreUI.playlist.visibleCols.album}">
                Album
                <i class="fa-solid fa-check"></i>
              </li>
              <li class="controls-menu-item" data-choosed="${staticStoreUI.playlist.visibleCols.date}">
                Date Added
                <i class="fa-solid fa-check"></i>
              </li>
              <li class="controls-menu-item" data-choosed="${staticStoreUI.playlist.visibleCols.duration}">
                Duration
                <i class="fa-solid fa-check"></i>
              </li>
            </ul>
          </div>
        </div>
        ${tracksPlaylistHTML}
    `
  }
  renderSuggestTracks(tracks) {
    if(tracks.length === 0) return
    const suggestTracksListHTML = tracks.map(track => (
      `
        <div class="suggest-tracks-row track-row">
            <div class="track-title">
              <img class="track-img" src="${track.image_url || "placeholder.svg"}" alt="" />
              <div class="track-info">
                <a class="track-name">${track.title}</a>
                <div class="track-artists">
                  <a class="track-artist">${track.artist_name === "null" ? "Chưa xác định" : track.artist_name}</a>
                </div>
              </div>
            </div>
            <a class="track-album">${track.album_title === "null" || !track.album_title ? "Chưa xác định" : track.album_title}</a>
            <button data-trackId=${track.id} class="suggest-tracks-add">Add</button>
          </div>
      `
    )).join("")
    this.suggestTracksListEl.innerHTML = suggestTracksListHTML
  }
  async getTracksPlaylist() {
    if(!this.playlistId) return
    try {
      const res = await httpRequest.get(`playlists/${this.playlistId}/tracks`)
      return res.tracks || ""
    } catch (error) {
      NotifyToast.show({
          message: error?.message || "An error occurred while adding the song.",
          type: "fail",
          duration: 3000
        })
      return []
    }
  }
  handleClickSuggestTracks(e) {
    if(e.target.closest("button.suggest-tracks-add")) {
      this.addTrackToPlaylist(e.target.closest("button.suggest-tracks-add"))
      localStorage.setItem("playlistScrollY", this.scrollTop)
      reload()
      return
    }

  }
  async addTrackToPlaylist(btn) {
    if(!btn.dataset.trackid) return
    try {
      const payload = {
        track_id: btn.dataset.trackid,
        position: 0
      }
      const res = await httpRequest.post(`playlists/${this.playlistId}/tracks`, payload)
      if(res.playlist_track) {
        NotifyToast.show({
          message: `${res.message}`,
          type: "success",
          duration: 3000
        })
      }
    } catch (error) {
      
        NotifyToast.show({
          message: error?.message || "An error occurred while adding the song.",
          type: "fail",
          duration: 3000
        })
      
    }
  }
  updateGrid() {
    const section = this.querySelector(".playlist-tracks-section");
    const template = Object.keys(this.cols)
      .map((key) => (staticStoreUI.playlist.visibleCols[key] ? this.cols[key] : "0fr"))
      .join(" ");
    section.querySelectorAll(".track-grid").forEach((grid) => {
      grid.style.gridTemplateColumns = template;
    });
  }
}
customElements.define("spotify-playlist", Playlist);
