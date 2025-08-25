import { navigate } from "../../router.js";
import { preloadImage } from "../../utils/preloadImage.js";

class SpotifySlider extends HTMLElement {
  static get observedAttributes() {
    return ["data-items"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="css/reset.css">
      <link rel="stylesheet" href="css/variables.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
      <link rel="stylesheet" href="components/slider/slider.css">
      <div class="spotify-slider-wrapper">
        <button class="soptify-slider-btn btn-back"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="soptify-slider-btn btn-next"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="spotify-slider"></div>
      </div>
    `;
    this.fallback = this.getAttribute("data-placeholder") || "placeholder.svg";
    this.handleClickItem = this.handleClickItem.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data-items" && newValue !== oldValue) {
      try {
        const items = JSON.parse(newValue);
        this.render(items);
      } catch (err) {
        console.error("Invalid JSON in data-items:", err);
      }
    }
  }

  render(items) {
    const slider = this.shadowRoot.querySelector(".spotify-slider");

    slider.innerHTML = items
      .map(
        (item, idx) => `
        <div class="spotify-card" data-itemType=${item.type} data-itemId=${
          item.id
        }>
          <div class="card-img">
            <img id="img-${idx}" alt="${item.name}">
            <div class="card-playBtn">
              <i class="fas fa-play"></i>
            </div>
          </div>
          <div class="card-info">
            <a href="${item.link__name || "#"}" class="card-name">${
          item.name
        }</a>
            <a data-canClick=${item.link__detail ? "true" : "false"} href="${
          item.link__detail
        }" class="card-detail">${item.detail || ""}</a>
          </div>
        </div>
      `
      )
      .join("");

    // preload ảnh sau khi render
    items.forEach((item, idx) => {
      const imgEl = this.shadowRoot.querySelector(`#img-${idx}`);
      preloadImage(item.image, imgEl, this.fallback).catch((err) => {
        console.warn("Image load failed:", err.message);
      });
    });
  }

  connectedCallback() {
    const slider = this.shadowRoot.querySelector(".spotify-slider");
    const btnBack = this.shadowRoot.querySelector(".btn-back");
    const btnNext = this.shadowRoot.querySelector(".btn-next");

    btnBack.addEventListener("click", () => {
      slider.scrollBy({ left: -220, behavior: "smooth" });
    });

    btnNext.addEventListener("click", () => {
      slider.scrollBy({ left: 220, behavior: "smooth" });
    });
    this.shadowRoot.addEventListener("click", this.handleClickItem);
  }
  handleClickItem(e) {
    const item = e.target.closest(".spotify-card");
    console.log(item);
    
    if (item) {
      navigate(`/${item.dataset.itemtype}/${item.dataset.itemid}`);
    }
  }
}

customElements.define("spotify-slider", SpotifySlider);
