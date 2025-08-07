import { store, subscribe } from "../../../store/store.js";
import NotifyToast from "../../toast/NotifyToast.js";
export default class Library extends HTMLElement {
  constructor() {
    super();
    this.viewMode = "list-default";
    this.sortMode = "recentlyAdded";
    this.closeMenu = this.closeMenu.bind(this);
    this.toggleSortMenu = this.toggleSortMenu.bind(this);
    this.changeViewMode = this.changeViewMode.bind(this);
    this.setViewMode = this.setViewMode.bind(this);
    this.renderLibrary = this.renderLibrary.bind(this);
    this.changeSortMode = this.changeSortMode.bind(this);
  }

  async connectedCallback() {
    const res = await fetch("components/sideBar/library/library.html");
    const html = await res.text();
    this.innerHTML = html;
    this.classList.add("library-content");
    this.sortBtn = this.querySelector(".sort-btn");
    this.sortBtnSpan = this.sortBtn.querySelector("span")
    this.sortBtnIcon = this.sortBtn.querySelector("i")
    this.sortMenu = this.querySelector(".sort-menu");
    this.libraryContainer = this.querySelector(".library-container");
    this.viewOptions = this.sortMenu.querySelector(".view-as-options");
    this.sortMenuUl = this.sortMenu.querySelector("ul");
    this.sortMenuItems = this.sortMenuUl.querySelectorAll(".sort-item")
    this.optionBtns = this.viewOptions.querySelectorAll(".option-btn");
    this.setViewMode(this.viewMode);
    this.unsubMyPlaylists = subscribe("libraryData", (data) =>
      this.renderLibrary(data)
    );
    this.renderLibrary(store.libraryData);
    document.addEventListener("click", this.toggleSortMenu);
  }
  disconnectedCallback() {
    document.removeEventListener("click", this.toggleSortMenu);
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
    const viewMode = target.dataset.viewmode;
    if (viewMode) {
      this.viewMode = viewMode;
      this.setViewMode(viewMode);
      this.closeMenu();
    }
  }
  changeSortMode(e) {
    const target = e.target.closest(".sort-item");
    const sortMode = target.dataset.sortmode;
    this.sortMenuItems.forEach(item => {
      item.classList.toggle("active", item.dataset.sortmode === sortMode)
    })
    if (!sortMode) {
      this.closeMenu()
      NotifyToast.show(
        {
          message: "Lỗi khi sắp xếp",
          type: "fail",
          duration: 3000,
        }
      )
    };
    if (sortMode === this.sortMode) return;
    this.sortMode = sortMode;
    this.sortBtnSpan.innerText = target.dataset.title
    store.libraryData = this.sortData(this.sortMode)
    this.closeMenu()
  }
  closeMenu() {
    this.sortMenu.classList.remove("show");
    this.viewOptions.removeEventListener("click", this.changeViewMode);
    this.sortMenuUl.removeEventListener("click", this.changeSortMode);
  }
  sortData(sortMode) {
    switch (sortMode) {
      case "recentlyAdded":
        return [...store.libraryData].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        
      case "recents":
        return store.libraryData
      case "alphabetical":
        return [...store.libraryData].sort((a, b) => a.name.localeCompare(b.name));
      case "creator":
       return [...store.libraryData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      default:
        return store.libraryData
    }
  }
  renderLibrary(data) {

    this.libraryContainer.innerHTML = "";
    if (data.length === 0) {
      return;
    }
    data = this.sortData(this.sortMode)
    data.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("library-item");
      itemElement.dataset.typeitem = item.type;
      itemElement.innerHTML = `
        <div class="item-image">
          <img src="${item.image_url || "placeholder.svg"}" alt="${
        item.name
      }" />
          <div class="item-playBtn">
            <i class="fas fa-play"></i>
          </div>
        </div>
        <div class="item-info">
          <div class="item-title">${item.name}</div>

          <div class="item-subtitle item-dot">•</div>
          ${
            item.type === "playlist"
              ? `
          <div class="item-subtitle">Playlist • ${item.user_display_name}</div>
        `
              : `
          <div class="item-subtitle">Artist</div>
        `
          }</div>
      `;
      this.libraryContainer.appendChild(itemElement);
    });
  }
}
customElements.define("spotify-library", Library);
