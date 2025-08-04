export default class RepeatControl extends HTMLElement {
  constructor() {
    super();
    this.dataset.controlType = "item";
    this.repeatModes = ["off", "all", "one"];
    this.currentModeIndex = 0;
    this.iconWrapper = document.createElement("div");
    this.appendChild(this.iconWrapper);

    const { iconOff, iconAll, iconOne } = this.#createIcons();
    this.iconOff = iconOff;
    this.iconAll = iconAll;
    this.iconOne = iconOne;

    this.iconWrapper.append(this.iconOff, this.iconAll, this.iconOne);
    this.updateIcons();

    this.iconWrapper.addEventListener("click", () => this.toggleRepeatMode());
  }

  connectedCallback() {
    if (!this.dataset.controlPlayer) {
      const player = this.closest("media-player");
      if (player) {
        this.dataset.controlPlayer = player.dataset.playerId || "default";
      }
    }
  }

  disconnectedCallback() {
    this.iconWrapper.removeEventListener("click", this.toggleRepeatMode);
  }

  setMedia(media) {
    this.media = media;
  }

  toggleRepeatMode() {
    this.currentModeIndex = (this.currentModeIndex + 1) % this.repeatModes.length;
    const newMode = this.repeatModes[this.currentModeIndex];
    this.updateIcons();

    const event = new CustomEvent("repeat-toggle", {
      bubbles: true,
      detail: {
        playerId: this.dataset.controlPlayer,
        repeatMode: newMode,
      },
    });
    this.dispatchEvent(event);
  }

  updateIcons() {
    const mode = this.repeatModes[this.currentModeIndex];
    this.iconOff.style.display = mode === "off" ? "inline" : "none";
    this.iconAll.style.display = mode === "all" ? "inline" : "none";
    this.iconOne.style.display = mode === "one" ? "inline" : "none";
  }

  #createIcons() {
    let iconOff = this.querySelector('[slot="repeat-off"]');
    let iconAll = this.querySelector('[slot="repeat-all"]');
    let iconOne = this.querySelector('[slot="repeat-one"]');

    if (!iconOff) {
      iconOff = document.createElement("span");
      iconOff.textContent = "🔁 Off";
      iconOff.slot = "repeat-off";
      this.prepend(iconOff);
    }

    if (!iconAll) {
      iconAll = document.createElement("span");
      iconAll.textContent = "🔁 All";
      iconAll.slot = "repeat-all";
      this.prepend(iconAll);
    }

    if (!iconOne) {
      iconOne = document.createElement("span");
      iconOne.textContent = "🔂 One";
      iconOne.slot = "repeat-one";
      this.prepend(iconOne);
    }

    return {
      iconOff,
      iconAll,
      iconOne,
    };
  }
}
