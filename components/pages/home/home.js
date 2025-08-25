import {store, subscribe} from "../../../store/store.js"

export default class HomePage extends HTMLElement {
  constructor() {
    super()
    this.unsubscribes = []
    this.renderSlider = this.renderSlider.bind(this)
  }

  async connectedCallback() {
    store.libraryItemIdActive = ""
    const res = await fetch("components/pages/home/home.html")
    this.innerHTML = await res.text()
    this.classList.add("content-wrapper")

    this.suggestArtistsSlider = this.querySelector("#home-suggest-artists")
    this.popularAlbumsSlider = this.querySelector("#home-popular-albums")
    this.popularTracksSlider = this.querySelector("#home-popular-tracks")
    this.trendingTracksSlider = this.querySelector("#home-trending-tracks")
    const bindSlider = (storeKey, el, mapper) => {
      const unsub = subscribe(storeKey, (items) => {
        this.renderSlider(el, items.map(mapper))
      })
      this.unsubscribes.push(unsub)
      if (store[storeKey]?.length) {
        this.renderSlider(el, store[storeKey].map(mapper))
      }
    }

    bindSlider("trendingArtists", this.suggestArtistsSlider, (a) => ({
      image: a.image_url, detail: "Artist", name: a.name, type: "artist", id: a.id
    }))

    bindSlider("popularAlbums", this.popularAlbumsSlider, (al) => ({
      image: al.cover_image_url, detail: al.artist_name, name: al.title, type: "album", id: al.id
    }))

    bindSlider("popularTracks", this.popularTracksSlider, (t) => ({
      image: t.image_url, detail: t.artist_name, name: t.title, type: "track", id: t.id
    }))

    bindSlider("trendingTracks", this.trendingTracksSlider, (t) => ({
      image: t.image_url, detail: t.artist_name, name: t.title, type: "track", id: t.id
    }))
  }

  disconnectedCallback() {
    // Hủy tất cả subscription trong store
  this.unsubscribes.forEach((unsub) => unsub());
  this.unsubscribes = [];

  // Xóa tham chiếu DOM để tránh memory leak
  this.suggestArtistsSlider = null;
  this.popularAlbumsSlider = null;
  this.popularTracksSlider = null;
  this.trendingTracksSlider = null;
  }

  renderSlider(el, data) {
    el.setAttribute("data-items", JSON.stringify(data))
  }
}
customElements.define("spotify-home", HomePage);
