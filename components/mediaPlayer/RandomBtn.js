export default class RandomBtn extends HTMLElement {
    constructor() {
        super();
        this.dataset.controlType = "list";
        this.isRandom = false;
        this.onClick = this.onClick.bind(this);
    }
    connectedCallback() {
        if (!this.dataset.controlPlayer) {
            const player = this.closest("media-player");
            if (player) {
                this.dataset.controlPlayer = player.dataset.playerId;
            } else {
                console.warn("RandomBtn: No <media-player> found in the hierarchy.");
            }
        }
        this.createIcon();
        this.addEventListener("click", this.onClick);
    }
    disconnectedCallback() {
        this.removeEventListener("click", this.onClick);
    }
    onClick() {
        if(this.isRandom) {
            this.classList.remove("active");
            this.isRandom = false;
        } else {
            this.classList.add("active");
            this.isRandom = true;
        }
        this.dispatchEvent(new CustomEvent("random-toggle", {
            detail: {
                isRandom: this.isRandom,
                playerId: this.dataset.controlPlayer
            },
            bubbles: true,
            composed: true
        }))
    }
    createIcon() {
        const icon = this.querySelector('[slot="random"]');
        if (!icon) {
            const newIcon = document.createElement("span");
            newIcon.textContent = "🔀";
            newIcon.slot = "random";
            this.appendChild(newIcon);
        }
    }
    get isRandomMode() {
        return this.isRandom;
    }
}