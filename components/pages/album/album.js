import httpRequest from "../../../utils/HttpRequest.js";
import NotifyToast from "../../toast/NotifyToast.js";
import { store, staticStoreUI, subscribe } from "../../../store/store.js";
import { navigate, reload } from "../../../router.js";
import { refreshLibrary } from "../../../main.js";
import { queueActions } from "../../../store/queueActions.js";
export class Album extends HTMLElement {
  constructor() {
    super();
    this.cols = {
      status: "30px",
      title: "4fr",
      duration: "1fr",
      menu: "30px",
    };

    this.getAlbumData = this.getAlbumData.bind(this);
    this.getTracksAlbum = this.getTracksAlbum.bind(this);

    this.render = this.render.bind(this);
    this.renderTracksAlbum = this.renderTracksAlbum.bind(this);
    this.updateGrid = this.updateGrid.bind(this);
    this.handleMenuAction = this.handleMenuAction.bind(this);
    this.likeAlbum = this.likeAlbum.bind(this)
    this.renderPlayingTracks = this.renderPlayingTracks.bind(this)
    this.updateQueue = this.updateQueue.bind(this)
  }

  async connectedCallback() {
    try {
      store.libraryItemIdActive = this.albumId
      // lấy dữ liệu artist
      this.album = await this.getAlbumData();
      // render giao diện
      this.render();

      // gán background cho hero
      if (this.artist?.background_image_url) {
        this.heroBackground.style.backgroundImage = `url("${this.artist.background_image_url}")`;
        this.heroBackground.style.backgroundSize = "cover";
        this.heroBackground.style.backgroundPosition = "center";
      }

      // lấy tracks & render
      
      this.albumControlPlayBtn = this.querySelector(".album-controls .left-controls .play-btn-large")
      this.albumControlPlayBtn.addEventListener("click",this.updateQueue)
      this.sectionAlbumTracks = this.querySelector(".album-tracks-section")
      this.tracksAlbum = await this.getTracksAlbum();
      this.renderTracksAlbum(this.tracksAlbum);
      this.likeBtn = this.querySelector(".album-like-btn")
      this.likeBtn.addEventListener("click", this.likeAlbum)
      this.unsubCurrentIndex = subscribe("currentIndex", (newIndex, oldIndex) =>
            this.renderPlayingTracks(oldIndex, newIndex)
          );
      // update grid
      this.updateGrid();

      // gắn menu
      this.rightControls = this.querySelector(".album-controls .right-controls")
      const menuBtns = this.querySelectorAll(".controls-menu-btn");
      menuBtns.forEach((btn) => {
        btn.addEventListener("click", this.toggleMenu.bind(this));
      });

      // sticky controls
      const hero = this.querySelector(".album-hero");
      const controls = this.querySelector(".album-controls");
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
            root: main,
            threshold: 0,
            rootMargin: "-16px 0px 0px 0px",
          }
        );
        observer.observe(hero);
      }
    } catch (err) {
      NotifyToast.show({
        message: err.message || "Error loading artist",
        type: "fail",
      });
    }
  }

  disconnectedCallback() {
    // Hủy subscribe store
    this.unsubArtistTrending?.();
    this.unsubPopularAlbums?.();
    this.unsubCurrentIndex?.();

    // Hủy observer sticky controls
    if (this.stickyObserver) {
      this.stickyObserver.disconnect();
      this.stickyObserver = null;
    }

    // Hủy event listener menu buttons
    this.playlistControlPlayBtn.removeEventListener("click", this.updateQueue)
    const menuBtns = this.querySelectorAll(".controls-menu-btn");
    menuBtns.forEach((btn) => {
      btn.removeEventListener("click", this.toggleMenu);
    });

    // Xóa tham chiếu DOM để GC giải phóng
    this.heroBackground = null;
    this.sectionArtistTracks = null;
    this.artistAlbumSlider = null;
  }

  render() {
    const html = `
      <link rel="stylesheet" href="components/pages/album/album.css" />

      <!-- Artist Hero -->
      <section class="album-hero">
        <div class="hero-background">
          <div class="hero-image">
            <img src="${this.album?.cover_image_url || "placeholder.svg"}" alt="" />
          </div>
          <div class="album-info">
            <span class="album-type">
              Album
            </span>
            <h2 class="album-name">${this.album?.title || ""}</h2>
            <span class="album-bio">${this.album?.description || ""}</span>
            <div class="album-detail">
              <img class="album-artist-img" src="${this.album.artist_image_url || "placeholder.svg"}" alt="" />
              <a href="#/artist/${this.album.artist_id}" class="album-artist-name">${this.album.artist_name}</a>
              <span class="album-year"> • ${this.album.release_date?.slice(0,4)|| "Chưa xác định"}</span>
              <span class="album-num-songs"> • ${this.album.total_tracks} songs</span>
              <span class="album-duration">, ${Math.trunc(this.album.total_duration / 60)}min ${
      this.album.total_duration % 60
    }sec</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Controls -->
      <section class="album-controls">
        <div class="left-controls">
          <button class="play-btn-large">
            <i class="fas fa-play"></i>
          </button>
          <div class="album-follow">
            <button class="album-like-btn">${this.album.is_liked ? "Dislike": "Like"}</button>
        </div>
        </div>
        <h3 class="album-controls-name">${this.album?.title || ""}</h3>
        <div data-compact="${
          staticStoreUI.album.viewModeTracksCompact
        }" class="right-controls">
          <button class="controls-menu-btn">
            <span class="compact">Compact</span>
            <span class="list">List</span>
            <i class='fa-solid fa-bars compact'></i>
            <i class='fa-solid fa-list list'></i>            
          </button>
          <ul class="controls-menu">
            <li class="controls-menu-item"><i class="fa-solid fa-bars"></i>Compact</li>
            <li class="controls-menu-item"><i class="fa-solid fa-list"></i>List</li>
          </ul>
        </div>
      </section>

      <!-- Album Tracks -->
      <h1 class="section-header">Tracks of album</h1>
      <section data-compact="${
        staticStoreUI.album.viewModeTracksCompact
      }" class="album-tracks-section"></section>
    `;
    this.innerHTML = html;
    this.classList.add("content-wrapper");

    this.heroBackground = this.querySelector(".hero-background");
    this.sectionArtistTracks = this.querySelector(".artist-tracks-section");
  }

  renderTracksAlbum(tracks) {
    if (!tracks || tracks.length === 0) return;
    const tracksAlbumHTML = tracks
      .map(
        (track, i) => `
      <div class="track-grid track-row">
        <div class="track-status">
          <span>${i + 1}</span>
          <i class="fa-solid fa-play"></i>
        </div>
        <div class="track-title">
          <img class="track-img" src="${
            track.image_url || "placeholder.svg"
          }" alt="" />
          <div class="track-info">
            <a class="track-name">${track.title}</a>
          </div>
        </div>
        <div class="track-duration">
          <span class="track-duration">
            ${String(Math.floor(track.duration / 60)).padStart(
              2,
              "0"
            )}:${String(track.duration % 60).padStart(2, "0")}
          </span>
        </div>
        <div class="last-column right-controls">
          <i class="fa-solid fa-ellipsis menu-icon controls-menu-btn"></i>
          <ul class="controls-menu lg-menu">
            <li class="controls-menu-item" data-trackid="${
              track.id
            }">Remove from this playlist</li>
            <li class="controls-menu-item">Save to your Liked songs</li>
          </ul>
        </div>
      </div>
    `
      )
      .join("");

    this.sectionAlbumTracks.innerHTML = `
      <div class="tracks-pseudo-el"></div>
      <div class="track-grid artist-tracks-header">
        <div class="tracks-header-item"><span>#</span></div>
        <div class="tracks-header-item"><span>Title</span></div>
        <div class="tracks-header-item"><span><i class="fa-solid fa-clock"></i></span></div>
        <div class="last-column right-controls">
          <i class="fa-solid fa-caret-down menu-icon controls-menu-btn"></i>
          <ul class="controls-menu lg-menu space-between-menu">
            <li class="controls-menu-title">Columns</li>
            <li class="controls-menu-item" data-choosed="${staticStoreUI.album.visibleCols.duration}">
              Duration <i class="fa-solid fa-check"></i>
            </li>
          </ul>
        </div>
      </div>
      ${tracksAlbumHTML}
    `;
  }

  async getAlbumData() {
    const res = await httpRequest.get(`albums/${this.albumId}`);
    return res;
  }

  async getTracksAlbum() {
    if (!this.albumId) return [];
    const res = await httpRequest.get(
      `albums/${this.albumId}/tracks`
    );
    if (res.status === 200) return res.tracks || [];
    return [];
  }
  async likeAlbum() {
    try {
        if(this.album.is_liked) {
            const res = await httpRequest.remove(`albums/${this.albumId}/like`)
            NotifyToast.show({message: res.message || "Success", type: "success"})
        }
        if (!this.album.is_liked) {
            const res = await httpRequest.post(`albums/${this.albumId}/like`)
            NotifyToast.show({message: res.message || "Success", type: "success"})
        }
        this.likeBtn.textContent = this.album.is_liked ? "Dislike" : "Like"
        refreshLibrary()
    } catch (error) {
        NotifyToast.show({message: error.message || "Fail", type: "fail"})
    }
  }
  toggleMenu(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const menu = btn.nextElementSibling;
    const allMenus = this.querySelectorAll(".controls-menu");

    allMenus.forEach((m) => {
      if (m !== menu) m.classList.remove("show");
    });
    menu.classList.toggle("show");

    document.addEventListener(
      "click",
      (event) => {
        if (!btn.contains(event.target)) menu.classList.remove("show");
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
      case "List":
        staticStoreUI.album.viewModeTracksCompact = "false";
        this.sectionAlbumTracks.dataset.compact =
          staticStoreUI.album.viewModeTracksCompact;
        this.rightControls.dataset.compact = staticStoreUI.artist.viewModeTracksCompact
        break;

      case "Compact":
        staticStoreUI.album.viewModeTracksCompact = "true";
        this.sectionAlbumTracks.dataset.compact =
          staticStoreUI.album.viewModeTracksCompact;
        this.rightControls.dataset.compact = staticStoreUI.album.viewModeTracksCompact
        break;

      case "Album":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.album.visibleCols.album =
          menuItem.dataset.choosed === "true";
        this.updateGrid();
        break;

      case "Listeners":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.album.visibleCols.listeners =
          menuItem.dataset.choosed === "true";
        this.updateGrid();
        break;

      case "Duration":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.album.visibleCols.duration =
          menuItem.dataset.choosed === "true";
        this.updateGrid();
        break;

      case "Remove from this playlist":
        try {
          const id = menuItem.dataset.trackid;
          const res = await httpRequest.remove(
            `playlists/${this.playlistId}/tracks/${id}`
          );
          NotifyToast.show({
            message: res.message || "Removed from this playlist",
            type: "success",
            duration: 3000,
          });
          localStorage.setItem("playlistScrollY", this.scrollTop);
          reload();
        } catch (error) {
          NotifyToast.show({
            message: error.message || "Have an error",
            type: "fail",
            duration: 3000,
          });
        }
        break;
    }
  }

  updateGrid() {
    const section = this.querySelector(".album-tracks-section");
    if (!section) return;
    const template = Object.keys(this.cols)
      .map((key) =>
        staticStoreUI.album.visibleCols[key] ? this.cols[key] : "0fr"
      )
      .join(" ");
    section.querySelectorAll(".track-grid").forEach((grid) => {
      grid.style.gridTemplateColumns = template;
    });
  }
  updateQueue() {
    if(!store.user) {
        NotifyToast.show({message: "Please login to listen", type: "info"})
        store.authModal_form = "login"
        store.authModal_status = "open"
        return
      }
        const queueData = this.tracksAlbum.map((track) => ({
          audio_url: track.audio_url,
          image: track.image_url,
          name: track.title,
          artist: this.album.artist_name,
          duration: track.duration,
          id: track.id,
        }));
        queueActions.clearQueue()
        queueActions.setQueue(queueData);
        store.currentIndex = 0;
        store.isPlaying = true;
        this.renderPlayingTracks(null, store.currentIndex)
      }
      renderPlayingTracks(oldIndex, newIndex) {
        const rows = document.querySelectorAll(".track-row");
        if (oldIndex != null && rows[oldIndex]) {
          rows[oldIndex].removeAttribute("data-playing");
        }
        if (newIndex != null && rows[newIndex]) {
          rows[newIndex].setAttribute("data-playing", "true");
        }
      }
}

customElements.define("spotify-album", Album);
