export default class VolumeControl extends HTMLElement {
  constructor() {
    super();
    this.dataset.controlType = "item";
    this.media = null;

    this.volumeSlider = document.createElement("input");
    this.volumeSlider.type = "range";
    this.volumeSlider.min = "0";
    this.volumeSlider.max = "1";
    this.volumeSlider.step = "0.01";
    this.volumeSlider.value = "1";

    const icons = this.#createIcon();
    this.muteIcon = icons.muteIcon;
    this.unmuteIcon = icons.unmuteIcon;

    this.iconWrapper = document.createElement("div");
    this.iconWrapper.append(this.muteIcon, this.unmuteIcon);

    this.appendChild(this.iconWrapper);
    this.appendChild(this.volumeSlider);

    this.onInput = this.onInput.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.updateVolume = this.updateVolume.bind(this);
  }

  connectedCallback() {
    if (!this.dataset.controlPlayer) {
      const player = this.closest("media-player");
      if (player) {
        this.dataset.controlPlayer = player.dataset.playerId;
        const media = player.media;
        if (media) {
          this.setMedia(media);
        } else {
          console.warn("VolumeControl: No media element found.");
        }
      } else {
        console.warn("VolumeControl: No <media-player> found.");
      }
    }

    this.volumeSlider.addEventListener("input", this.onInput);
    this.iconWrapper.addEventListener("click", this.toggleMute);
  }

  disconnectedCallback() {
    this.volumeSlider.removeEventListener("input", this.onInput);
    this.iconWrapper.removeEventListener("click", this.toggleMute);
    if (this.media) {
      this.media.removeEventListener("volumechange", this.updateVolume);
    }
  }

  setMedia(media) {
    if (this.media) {
      this.media.removeEventListener("volumechange", this.updateVolume);
    }

    this.media = media;
    if (!media) return;
    this.media.volume = localStorage.getItem(`player${this.dataset.controlPlayer}volume`) || 1;
    this.media.muted = localStorage.getItem(`player${this.dataset.controlPlayer}muted`) === "true";
    media.addEventListener("volumechange", this.updateVolume);
    this.updateVolume();
  }

  onInput() {
    if (!this.media) return;

    const volume = parseFloat(this.volumeSlider.value);
    this.media.volume = volume;
    this.media.muted = volume === 0;

    this.#dispatchVolumeEvent(volume, this.media.muted);
  }

  toggleMute() {
    if (!this.media) return;
    this.media.muted = !this.media.muted;
    this.updateVolume()
    
    this.#dispatchVolumeEvent(this.media.volume, this.media.muted);
  }

  updateVolume() {
    if (!this.media) return;

    const volume = this.media.volume.toFixed(2) || 0.5;
    this.media.muted ? this.volumeSlider.value = "0" : this.volumeSlider.value = volume;
    this.volumeSlider.setAttribute("aria-valuenow", volume);
    this.muteIcon.style.display = this.media.muted ? "inline" : "none";
    this.unmuteIcon.style.display = this.media.muted ? "none" : "inline";
  }

  #dispatchVolumeEvent(volume, muted) {
    const event = new CustomEvent("volume-change", {
      bubbles: true,
      composed: true,
      detail: {
        playerId: this.dataset.controlPlayer,
        volume,
        muted,
      },
    });
    this.dispatchEvent(event);
  }

  #createIcon() {
    let muteIcon = this.querySelector('[slot="mute"]');
    let unmuteIcon = this.querySelector('[slot="unmute"]');

    if (!muteIcon) {
      muteIcon = document.createElement("span");
      muteIcon.textContent = "🔇";
      muteIcon.slot = "mute";
      this.prepend(muteIcon);
    }

    if (!unmuteIcon) {
      unmuteIcon = document.createElement("span");
      unmuteIcon.textContent = "🔊";
      unmuteIcon.slot = "unmute";
      this.prepend(unmuteIcon);
    }

    return { muteIcon, unmuteIcon };
  }
}
