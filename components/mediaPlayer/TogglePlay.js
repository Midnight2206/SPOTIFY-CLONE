export default class TogglePlay extends HTMLElement {
  constructor() {
    super();
    this.media = null;
    this.togglePlay = this.togglePlay.bind(this);
    this.updateState = this.updateState.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  connectedCallback() {
    if(!this.dataset.controlPlayer) {
      const player = this.closest("media-player");
      if (player) {
        this.dataset.controlPlayer = player.dataset.playerId
      } else {
        console.warn("TogglePlay: No media player found in the hierarchy.");
      }
    }
    this.dataset.controlType = 'item'
    this.#ensureDefaultIcons();
    this.setAttribute("role", "button");
    this.setAttribute("aria-label", "Toggle Play");
    this.setAttribute("tabindex", "0");
    document.addEventListener("keydown", this.handleKeydown);
    this.addEventListener("click", this.togglePlay);
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.togglePlay);
    if (this.media) {
      this.media.removeEventListener("play", this.updateState);
      this.media.removeEventListener("pause", this.updateState);
    }
    document.removeEventListener("keydown", this.handleKeydown);
  }
  setMedia(media) {
    if (this.media) {
      this.media.removeEventListener("play", this.updateState);
      this.media.removeEventListener("pause", this.updateState);
    }
    this.media = media;
    this.updateState();
    this.media.addEventListener("play", this.updateState);
    this.media.addEventListener("pause", this.updateState);
  }
  handleKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.togglePlay();
    }
  }
  togglePlay() {
    if (!this.media) return;
    this.media.paused ? this.media.play() : this.media.pause();
  }
  updateState() {
    const playIcon = this.querySelector('[slot="play"]');
    const pauseIcon = this.querySelector('[slot="pause"]');
    const mediaPlayer = document.querySelector('media-player')
    const img = mediaPlayer.querySelector(".audio-disk");
    
    if (!playIcon || !pauseIcon) return;
    if (this.media.paused) {
      playIcon.style.display = "inline-block";
      pauseIcon.style.display = "none";
      if(img) img.classList.remove('playing')
    } else {
      playIcon.style.display = "none";
      pauseIcon.style.display = "inline-block";
      if(img) img.classList.add('playing')
    }
    this.setAttribute("data-state", this.media.paused ? "paused" : "playing");
    this.setAttribute("aria-label", this.dataset.label || "Toggle Play");
  }

  // Private methods
  #ensureDefaultIcons() {
    if (!this.querySelector('[slot="play"]')) {
      const play = document.createElement("span");
      play.setAttribute("slot", "play");
      play.textContent = "▶️";
      this.appendChild(play);
    }
    if (!this.querySelector('[slot="pause"]')) {
      const pause = document.createElement("span");
      pause.setAttribute("slot", "pause");
      pause.textContent = "⏸️";
      this.appendChild(pause);
    }
  }
}
