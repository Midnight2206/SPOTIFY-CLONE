export default class MediaSeek extends HTMLElement {
  constructor() {
    super();
    this.dataset.controlType = "item";
    this.media = null;

    this.range = document.createElement("input");
    this.range.type = "range";
    this.range.min = "0";
    this.range.max = "100";
    this.range.value = "0";
    this.range.step = "0.1";
    this.range.classList.add("media-seek-bar");
    this.appendChild(this.range);

    this.isPointerDown = false;
    this.onInput = this.onInput.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
  }

  connectedCallback() {
    if (!this.dataset.controlPlayer) {
      const player = this.closest("media-player");
      if (player) {
        this.dataset.controlPlayer = player.dataset.playerId;
      } else {
        console.warn("MediaSeek: No media player found in the hierarchy.");
      }
    }

    this.range.addEventListener("input", this.onInput);
    this.range.addEventListener("pointerdown", this.onPointerDown);
    this.range.addEventListener("pointerup", this.onPointerUp);
  }

  disconnectedCallback() {
    this.range.removeEventListener("input", this.onInput);
    this.range.removeEventListener("pointerdown", this.onPointerDown);
    this.range.removeEventListener("pointerup", this.onPointerUp);

    if (this.media) {
      this.media.removeEventListener("timeupdate", this.onTimeUpdate);
    }
  }

  setMedia(media) {
    if (this.media) {
      this.media.removeEventListener("timeupdate", this.onTimeUpdate);
    }
    this.media = media;
    const setup = () => {
      this.range.value = (
        (media.currentTime / media.duration) * 100 || 0
      ).toFixed(2);
      this.media.addEventListener("timeupdate", this.onTimeUpdate);
    };
    if (media.readyState >= 2) {
      setup();
    } else {
      media.addEventListener("loadedmetadata", setup, { once: true });
    }
    
  }

  onInput() {
    if (!this.media) return;
    const newTime = (parseFloat(this.range.value) / 100) * this.media.duration;
    this.media.currentTime = newTime;
  }

  onPointerDown() {
    this.isPointerDown = true;
  }

  onPointerUp() {
    this.isPointerDown = false;
    this.onInput();
    this.media?.play().catch((error) => {
      console.error("MediaSeek: Failed to resume playback:", error);
    });
  }

  onTimeUpdate() {
    if (!this.media || this.isPointerDown) return;
    const percentage = (this.media.currentTime / this.media.duration) * 100;
    this.range.value = percentage.toFixed(2);
  }
}
