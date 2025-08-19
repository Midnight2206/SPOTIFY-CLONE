import { navigate } from "../../../router.js";
import { store, subscribe } from "../../../store/store.js";
import NotifyToast from "../../toast/NotifyToast.js";
import { preloadImage } from "../../../utils/preloadImage.js";
export default class Library extends HTMLElement {
  constructor() {
    super();
    this.viewMode = "list-default";
    this.sortMode = "recentlyAdded";
    this.searchKeyWordCurrent = ""
    this.closeMenu = this.closeMenu.bind(this);
    this.toggleSortMenu = this.toggleSortMenu.bind(this);
    this.changeViewMode = this.changeViewMode.bind(this);
    this.setViewMode = this.setViewMode.bind(this);
    this.renderLibrary = this.renderLibrary.bind(this);
    this.renderData = store.libraryData;
    this.changeSortMode = this.changeSortMode.bind(this);
    this.toggleSearchInput = this.toggleSearchInput.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleClickItem = this.handleClickItem.bind(this);
    this.openSearchInput = this.openSearchInput.bind(this);
    this.closeSearchInput = this.closeSearchInput.bind(this);
  }

  async connectedCallback() {
    const res = await fetch("components/sideBar/library/library.html");
    const html = await res.text();
    this.innerHTML = html;
    this.classList.add("library-content");
    this.searchLibraryBtn = this.querySelector(".search-library-btn");
    this.searchContainer = this.querySelector(".search-container");
    this.searchInput = this.searchContainer.querySelector("input");
    if (this.searchKeyWordCurrent) this.openSearchInput();
    this.sideBar = document.querySelector(".sidebar");
    this.sortBtn = this.querySelector(".sort-btn");
    this.sortBtnSpan = this.sortBtn.querySelector("span");
    this.sortBtnIcon = this.sortBtn.querySelector("i");
    this.sortMenu = this.querySelector(".sort-menu");
    this.libraryContainer = this.querySelector(".library-container");
    this.viewOptions = this.sortMenu.querySelector(".view-as-options");
    this.sortMenuUl = this.sortMenu.querySelector("ul");
    this.sortMenuItems = this.sortMenuUl.querySelectorAll(".sort-item");
    this.optionBtns = this.viewOptions.querySelectorAll(".option-btn");
    this.setViewMode(this.viewMode);
    this.unsubLibraryData = subscribe("libraryData", (data) => {
      if (this.searchKeyWordCurrent) {
        this.renderData = data.filter((item) =>
          item.name.toLowerCase().includes(this.searchKeyWordCurrent)
        );
      } else {
        this.renderData = data;
      }
      this.renderLibrary();
    });
    this.renderLibrary();
    this.sideBar.addEventListener("click", this.toggleSearchInput);
    document.addEventListener("click", this.toggleSortMenu);
    document.addEventListener("click", this.handleClickItem);
  }
  disconnectedCallback() {
    document.removeEventListener("click", this.toggleSortMenu);
    this.unsubLibraryData();
  }
  setViewMode(viewMode) {
    this.libraryContainer.dataset.viewmode = viewMode;
    this.optionBtns.forEach((optionBtn) => {
      optionBtn.classList.toggle(
        "active",
        optionBtn.dataset.viewmode === viewMode
      );
    });
  }
  openSearchInput() {
    this.searchContainer.classList.add("open");
    this.searchInput.value = this.searchKeyWordCurrent;
    if (!this.hasEventSearchInput) {
      this.searchInput.addEventListener("input", this.handleSearch);
      this.hasEventSearchInput = true;
    }
  }

  closeSearchInput() {
    if (!this.searchContainer.classList.contains("open")) return;
    this.searchInput.value = "";
    this.searchKeyWordCurrent = "";
    this.searchInput.removeEventListener("input", this.handleSearch);
    this.hasEventSearchInput = false;
    this.searchContainer.classList.remove("open");
    this.renderData = store.libraryData;
    this.renderLibrary();
  }
  toggleSearchInput(e) {
    if (e.target.closest(".search-library-btn")) {
      this.searchContainer.classList.add("open");
      this.openSearchInput();
    }
    if (
      !e.target.closest(".search-container") &&
      !e.target.closest(".sort-container") &&
      !e.target.closest(".library-container")
    ) {
      this.closeSearchInput();
    }
  }
  handleSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    this.searchKeyWordCurrent = keyword;
    if (keyword) {
      this.renderData = store.libraryData.filter((item) =>
        item.name.toLowerCase().includes(keyword)
      );
      this.renderLibrary();
    } else {
      this.renderData = store.libraryData;
      this.renderLibrary();
    }
  }
  toggleSortMenu(e) {
    if (e.target.closest(".sort-btn")) {
      if (this.sortMenu.classList.contains("show")) {
        this.closeMenu();
      } else {
        this.sortMenu.classList.add("show");
        this.viewOptions.addEventListener("click", this.changeViewMode);
        this.sortMenuUl.addEventListener("click", this.changeSortMode);
      }
    } else if (!e.target.closest(".sort-menu")) {
      this.closeMenu();
    }
  }
  changeViewMode(e) {
    const target = e.target.closest(".option-btn");
    const viewModeIcon = target.querySelector("i");
    const viewMode = target.dataset.viewmode;
    if (viewMode) {
      this.viewMode = viewMode;
      this.setViewMode(viewMode);
      this.sortBtnIcon.className = viewModeIcon.className;
      this.closeMenu();
    }
  }
  changeSortMode(e) {
    const target = e.target.closest(".sort-item");
    const sortMode = target.dataset.sortmode;
    this.sortMenuItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.sortmode === sortMode);
    });
    if (!sortMode) {
      this.closeMenu();
      NotifyToast.show({
        message: "Lỗi khi sắp xếp",
        type: "fail",
        duration: 3000,
      });
    }
    if (sortMode === this.sortMode) return;
    this.sortMode = sortMode;
    this.sortBtnSpan.innerText = target.dataset.title;
    this.renderLibrary();
    this.closeMenu();
  }
  closeMenu() {
    this.sortMenu.classList.remove("show");
    this.viewOptions.removeEventListener("click", this.changeViewMode);
    this.sortMenuUl.removeEventListener("click", this.changeSortMode);
  }
  sortData(sortMode) {
    switch (sortMode) {
      case "recentlyAdded":
        this.renderData = this.renderData.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
        return;
      case "recents":
        return;
      case "alphabetical":
        this.renderData = this.renderData.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        return;
      case "creator":
        this.renderData = this.renderData.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return;
      default:
        return;
    }
  }
  renderLibrary() {
    this.libraryContainer.innerHTML = "";
    if (this.renderData.length === 0) {
      return;
    }

    this.sortData(this.sortMode);

    this.renderData.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("library-item");
      itemElement.dataset.typeitem = item.type;
      itemElement.dataset.id = item.id;
      // Tạo markup
      itemElement.innerHTML = `
      <div class="item-image">
        <img alt="${item.name}" />
        <div class="item-playBtn">
          <i class="fas fa-play"></i>
        </div>
      </div>
      <div class="item-info">
        <div class="item-title">${item.name}</div>
        <div class="item-subtitle item-dot">•</div>
        ${
          item.type === "playlists"
            ? `<div class="item-subtitle">Playlist • ${item.user_display_name}</div>`
            : `<div class="item-subtitle">Artist</div>`
        }
      </div>
    `;
      const imgEl = itemElement.querySelector("img");
      preloadImage(
        item.image_url || "placeholder.svg",
        imgEl,
        "placeholder.svg"
      );

      this.libraryContainer.appendChild(itemElement);
    });
  }
  handleClickItem(e) {
    const target = e.target.closest(".library-item");
    if (target) {
      localStorage.setItem("playlistScrollY", 0)
      const id = target.dataset.id;
      navigate(`/playlist/${id}`);
    }
  }
}
customElements.define("spotify-library", Library);
