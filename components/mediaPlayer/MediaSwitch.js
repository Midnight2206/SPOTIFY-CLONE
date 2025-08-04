export default class MediaSwitch extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const switchType = this.dataset.switchType
    if (!switchType) {
      console.warn("MediaSwitch: 'switchType' attribute is required.");
      return;
    }
    if(!this.dataset.controlPlayer) {
      const player = this.closest("media-player");
      if (player) {
        this.dataset.controlPlayer = player.dataset.playerId
      } else {
        console.warn("TogglePlay: No media player found in the hierarchy.");
      }
    }
    this.dataset.controlType = 'list';
    this.setAttribute("role", "button");
    this.setAttribute("aria-label", "Switch Media");
    this.setAttribute("tabindex", "0");
    this.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.switchMedia();
      }
    });
    this.addEventListener("click", this.switchMedia);
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.switchMedia);
  }
  switchMedia() {
    const player = document.querySelector(`[data-player-id="${this.dataset.controlPlayer}"]`);
    if (!player) {
      console.warn("MediaSwitch: No media player found with the specified ID.");
      return;
    }
    if (player.media) {
      if (this.dataset.switchType === 'next') {
        player.nextMedia()
      }
      if (this.dataset.switchType === 'prev') {
        player.previousMedia();
      }
    } else {
      console.warn("MediaSwitch: No media is currently loaded in the player.");
    }
  }
}