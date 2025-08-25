import httpRequest from "../../../utils/HttpRequest.js";
import NotifyToast from "../../toast/NotifyToast.js";
import { store, staticStoreUI, subscribe } from "../../../store/store.js";
import { queueActions } from "../../../store/queueActions.js";
import { navigate, reload } from "../../../router.js";
import { refreshLibrary } from "../../../main.js";
export class Artist extends HTMLElement {
  constructor() {
    super();
    this.cols = {
      status: "30px",
      title: "4fr",
      album: "2fr",
      listeners: "1fr",
      duration: "50px",
      menu: "30px",
    };

    this.getArtistData = this.getArtistData.bind(this);
    this.getTracksArtist = this.getTracksArtist.bind(this);
    this.getArtistAlbums = this.getArtistAlbums.bind(this);

    this.render = this.render.bind(this);
    this.renderTracksArtist = this.renderTracksArtist.bind(this);
    this.renderAlbums = this.renderAlbums.bind(this);
    this.updateGrid = this.updateGrid.bind(this);
    this.handleMenuAction = this.handleMenuAction.bind(this);
    this.followArtist = this.followArtist.bind(this)
    this.updateQueue = this.updateQueue.bind(this)
  }

  async connectedCallback() {
    try {
      // lấy dữ liệu artist
      this.artist = await this.getArtistData();
      // lấy album
      this.artistAlbums = await this.getArtistAlbums();
      this.artistAlbumsData = (this.artistAlbums || []).map((album) => ({
        image: album.cover_image_url,
        detail: `Release at: ${album.release_date}`,
        name: album.title,
        type: "album",
      }));

      // render giao diện
      this.render();

      // gán background cho hero
      if (this.artist?.background_image_url) {
        this.heroBackground.style.backgroundImage = `url("${this.artist.background_image_url}")`;
        this.heroBackground.style.backgroundSize = "cover";
        this.heroBackground.style.backgroundPosition = "center";
      }

      // lấy tracks & render
      this.tracksArtist = await this.getTracksArtist();

      this.renderTracksArtist(this.tracksArtist);
      this.followBtn = this.querySelector(".artist-follow-btn")
      this.followBtn.addEventListener("click", this.followArtist)
      this.artistControlPlayBtn = this.querySelector(".artist-controls .left-controls .play-btn-large")
      this.artistControlPlayBtn.addEventListener("click",this.updateQueue)
      this.unsubCurrentIndex = subscribe("currentIndex", (newIndex, oldIndex) =>
            this.renderPlayingTracks(oldIndex, newIndex)
          );
      // render album slider
      this.renderAlbums();

      // update grid
      this.updateGrid();

      // gắn menu
      this.rightControls = this.querySelector(".artist-controls .right-controls")
      const menuBtns = this.querySelectorAll(".controls-menu-btn");
      menuBtns.forEach((btn) => {
        btn.addEventListener("click", this.toggleMenu.bind(this));
      });

      // sticky controls
      const hero = this.querySelector(".artist-hero");
      const controls = this.querySelector(".artist-controls");
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

      this.artistControlPlayBtn.removeEventListener("click", this.updateQueue)
    // Xóa tham chiếu DOM để GC giải phóng
    this.heroBackground = null;
    this.sectionArtistTracks = null;
    this.artistAlbumSlider = null;
  }

  render() {
    const html = `
      <link rel="stylesheet" href="components/pages/artist/artist.css" />

      <!-- Artist Hero -->
      <section class="artist-hero">
        <div class="hero-background">
          <div class="hero-image">
            <img src="${this.artist?.image_url || "placeholder.svg"}" alt="" />
          </div>
          <div class="artist-info">
            <span class="artist-verify">
              <i class="fa-solid fa-circle-check"></i>
              Verify Artist
            </span>
            <h2 class="artist-name">${this.artist?.name || ""}</h2>
            <span class="artist-detail">${this.artist?.bio || ""}</span>
            <span class="artist-listeners">
              ${
                this.artist?.monthly_listeners?.toLocaleString("en-US") || 0
              } monthly listeners
            </span>
          </div>
        </div>
      </section>

      <!-- Controls -->
      <section class="artist-controls">
        <div class="left-controls">
          <button class="play-btn-large">
            <i class="fas fa-play"></i>
          </button>
          <div class="artist-follow">
            <button class="artist-follow-btn">${this.artist.is_following ? "Unfollow": "Follow"}</button>
        </div>
        </div>
        <h3 class="artist-controls-name">${this.artist?.name || ""}</h3>
        <div data-compact="${
          staticStoreUI.artist.viewModeTracksCompact
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

      <!-- Popular Tracks -->
      <h1 class="section-header">Popular tracks</h1>
      <section data-compact="${
        staticStoreUI.artist.viewModeTracksCompact
      }" class="artist-tracks-section"></section>

      <!-- Albums -->
      ${
        this.artistAlbums?.length > 0
          ? `<h1 class="section-header">Album of artist</h1>
           <spotify-slider id="artist-album"></spotify-slider>`
          : ""
      }
    `;
    this.innerHTML = html;
    this.classList.add("content-wrapper");

    this.heroBackground = this.querySelector(".hero-background");
    this.sectionArtistTracks = this.querySelector(".artist-tracks-section");
  }

  renderAlbums() {
    if (this.artistAlbums?.length > 0) {
      this.artistAlbumSlider = this.querySelector("#artist-album");
      if (this.artistAlbumSlider) {
        this.artistAlbumSlider.setAttribute(
          "data-items",
          JSON.stringify(this.artistAlbumsData)
        );
      }
    }
  }

  renderTracksArtist(tracks) {
    if (!tracks || tracks.length === 0) return;
    const tracksPlaylistHTML = tracks
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
        <a class="track-album">${track.album_title || "Chưa xác định"}</a>
        <div class="track-date-added">${track.play_count}</div>
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

    this.sectionArtistTracks.innerHTML = `
      <div class="tracks-pseudo-el"></div>
      <div class="track-grid artist-tracks-header">
        <div class="tracks-header-item"><span>#</span></div>
        <div class="tracks-header-item"><span>Title</span></div>
        <div class="tracks-header-item"><span>Album</span></div>
        <div class="tracks-header-item"><span>Listeners</span></div>
        <div class="tracks-header-item"><span><i class="fa-solid fa-clock"></i></span></div>
        <div class="last-column right-controls">
          <i class="fa-solid fa-caret-down menu-icon controls-menu-btn"></i>
          <ul class="controls-menu lg-menu space-between-menu">
            <li class="controls-menu-title">Columns</li>
            <li class="controls-menu-item" data-choosed="${staticStoreUI.artist.visibleCols.album}">
              Album <i class="fa-solid fa-check"></i>
            </li>
            <li class="controls-menu-item" data-choosed="${staticStoreUI.artist.visibleCols.date}">
              Listeners <i class="fa-solid fa-check"></i>
            </li>
            <li class="controls-menu-item" data-choosed="${staticStoreUI.artist.visibleCols.duration}">
              Duration <i class="fa-solid fa-check"></i>
            </li>
          </ul>
        </div>
      </div>
      ${tracksPlaylistHTML}
    `;
  }

  async getArtistData() {
    const res = await httpRequest.get(`artists/${this.artistId}`);
    return res;
  }

  async getArtistAlbums() {
    const res = await httpRequest.get(`artists/${this.artistId}/albums`);
    return res.albums;
  }

  async getTracksArtist() {
    if (!this.artistId) return [];
    const res = await httpRequest.get(
      `artists/${this.artistId}/tracks/popular`
    );
    if (res.status === 200) return res.tracks || [];
    return [];
  }
  async followArtist() {
    try {
        if(this.artist.is_following) {
            const res = await httpRequest.remove(`artists/${this.artistId}/follow`)
            NotifyToast.show({message: res.message || "Success", type: "success"})
        }
        if (!this.artist.is_following) {
            const res = await httpRequest.post(`artists/${this.artistId}/follow`)
            NotifyToast.show({message: res.message || "Success", type: "success"})
        }
        reload()
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
        staticStoreUI.artist.viewModeTracksCompact = "false";
        this.sectionArtistTracks.dataset.compact =
          staticStoreUI.artist.viewModeTracksCompact;
        this.rightControls.dataset.compact = staticStoreUI.artist.viewModeTracksCompact
        break;

      case "Compact":
        staticStoreUI.artist.viewModeTracksCompact = "true";
        this.sectionArtistTracks.dataset.compact =
          staticStoreUI.artist.viewModeTracksCompact;
        this.rightControls.dataset.compact = staticStoreUI.artist.viewModeTracksCompact
        break;

      case "Album":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.artist.visibleCols.album =
          menuItem.dataset.choosed === "true";
        this.updateGrid();
        break;

      case "Listeners":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.artist.visibleCols.listeners =
          menuItem.dataset.choosed === "true";
        this.updateGrid();
        break;

      case "Duration":
        menuItem.dataset.choosed =
          menuItem.dataset.choosed === "true" ? "false" : "true";
        staticStoreUI.artist.visibleCols.duration =
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
    const section = this.querySelector(".artist-tracks-section");
    if (!section) return;
    const template = Object.keys(this.cols)
      .map((key) =>
        staticStoreUI.artist.visibleCols[key] ? this.cols[key] : "0fr"
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
      const queueData = this.tracksArtist.map((track) => ({
        audio_url: track.audio_url,
        image: track.image_url,
        name: track.title,
        artist: track.album_title,
        duration: track.duration,
        id: track.id,
      }));
      queueActions.clearQueue()
      queueActions.setQueue(queueData);
      store.currentIndex = 0;
      store.isPlaying = true;
      this.renderPlayingTracks(null. store.currentIndex)
      store.libraryItemIdActive = this.artistId
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

customElements.define("spotify-artist", Artist);
