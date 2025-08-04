export default class MediaPlayer extends HTMLElement {
  constructor() {
    super();
    this.media = null;
    this.playList = [];
    this.currentIndex = 0;
    this.repeatMode = "off";
    this.isRandom = false;
    this.remain = [];

    this.endedMedia = this.endedMedia.bind(this);
    this.previousMedia = this.previousMedia.bind(this);
    this.nextMedia = this.nextMedia.bind(this);
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.handleToggleRepeat = this.handleToggleRepeat.bind(this);
    this.handleToggleRandom = this.handleToggleRandom.bind(this);
  }

  connectedCallback() {
    this.dataset.playerId = this.dataset.playerId || crypto.randomUUID();

    this.mediaCover = document.createElement("div");
    this.mediaCover.dataset.mediaCover = true;
    this.prepend(this.mediaCover);

    document.addEventListener("random-toggle", this.handleToggleRandom);

    document.addEventListener("repeat-toggle", this.handleToggleRepeat);

    document.addEventListener("volume-change", this.handleVolumeChange);
  }

  disconnectedCallback() {
    document.removeEventListener("volume-change", this.handleVolumeChange);
  }

  setPlayList(list) {
    if (!Array.isArray(list) || list.length === 0) {
      console.warn("Playlist must be a non-empty array");
      return;
    }
    this.playList = list.map(item => {
      if(item.type === "audio" || item.type === "video") return item
    })
    this.currentIndex = 0;
    this.remain = this.playList.map((_, i) => {
      return i;
    });
    this.renderMedia();
  }

  renderMedia() {
  const item = this.playList[this.currentIndex];
  if (!item) return;

  if (this.media) {
    this.media.removeEventListener("ended", this.endedMedia);
    this.media.remove();
  }

  this.media = document.createElement(item.type);
  this.media.src = item.src;
  this.media.addEventListener("ended", this.endedMedia);
  this.media.onerror = () => {
    console.warn(`Media lỗi: ${item.src}`);
    this.nextMedia(false);
  }
  this.mediaCover.innerHTML = "";
  if (item.type === "audio") {
    const wrapper = document.createElement("div");
    wrapper.classList.add("audio-wrapper");

    const img = document.createElement("img");
    img.classList.add("audio-disk");
    img.src = item.thumb || "/src/MediaPlay/img/default-disk-audio.jpg";
    img.onerror = () => {
      img.onerror = null;
      img.src = "/src/MediaPlay/img/default-disk-audio.jpg";
    };

    wrapper.appendChild(img);
    wrapper.appendChild(this.media);
    this.mediaCover.appendChild(wrapper);
  } else {
    this.mediaCover.appendChild(this.media);
  }
  this.media.play().catch(console.warn);
  document
    .querySelectorAll(`[data-control-player="${this.dataset.playerId}"]`)
    .forEach((el) => {
      if (
        el.dataset.controlType === "item" &&
        typeof el.setMedia === "function"
      ) {
        el.setMedia(this.media);
      }
    });
}

  handleVolumeChange(e) {
    const { playerId, volume, muted } = e.detail || {};
    if (playerId !== this.dataset.playerId || !this.media) return;
    localStorage.setItem(`player${playerId}volume`, JSON.stringify(volume));
    localStorage.setItem(`player${playerId}muted`, muted);
  }
  handleToggleRepeat(e) {
    const { playerId, repeatMode } = e.detail || {};
    if (playerId !== this.dataset.playerId) return;
    this.repeatMode = repeatMode;
    console.log(this.repeatMode);
  }
  handleToggleRandom(e) {
    if (e.detail?.playerId === this.dataset.playerId) {
      this.isRandom = e.detail.isRandom;
      this.remain = [];
    } else return;
  }
  endedMedia() {
    if (this.repeatMode === "one") {
      this.media.currentTime = 0;
      this.media.play();
      return;
    }
    this.nextMedia(true);
  }

  nextMedia(fromEnded = false) {
    if (!fromEnded) {
      this.currentIndex = this.isRandom
        ? this.createRandomIndex()
        : this.currentIndex >= this.playList.length - 1
        ? 0
        : this.currentIndex + 1;
      this.renderMedia();
    } else {
      switch (this.repeatMode) {
        case "one":
          this.renderMedia();
          break;
        case "off":
          if (this.isRandom) {
            if (this.remain.length === 0) return;
            this.currentIndex = this.createRandomIndex();
          } else {
            if (this.currentIndex >= this.playList.length - 1) return;
            this.currentIndex++;
          }
          break;
        case "all":
          this.currentIndex = this.isRandom
            ? this.createRandomIndex()
            : this.currentIndex >= this.playList.length - 1
            ? 0
            : this.currentIndex + 1;
          this.renderMedia();
          break;
      }
    }
  }

  previousMedia() {
    if (this.isRandom) {
      this.currentIndex = this.createRandomIndex();
    } else {
      this.currentIndex--;
      if (this.currentIndex < 0) {
        this.currentIndex =
          this.repeatMode === "all" ? this.playList.length - 1 : 0;
      }
    }
    this.renderMedia();
  }

  createRandomIndex() {
    if (this.remain.length === 0) {
      this.remain = this.playList.map((_, i) => i);
    }
    const index = Math.floor(Math.random() * this.remain.length);
    const currentIndex = this.remain[index];
    this.remain.splice(index, 1);
    return currentIndex;
  }
}
