import { store, subscribe } from "../../store/store.js";
import { queueActions } from "../../store/queueActions.js";
export default class Footer extends HTMLElement {
  constructor() {
    super();
    this.renderTogglePlayBtn = this.renderTogglePlayBtn.bind(this);
    this.toggleMediaPlaying = this.toggleMediaPlaying.bind(this);
    this.renderTrackInfo = this.renderTrackInfo.bind(this);
    this.backwardMedia = this.backwardMedia.bind(this);
    this.forwardMedia = this.forwardMedia.bind(this);
    this.renderProgress = this.renderProgress.bind(this)
    this.toggleRandom = this.toggleRandom.bind(this)
    this.renderRandom = this.renderRandom.bind(this)
    this.redoMedia = this.redoMedia.bind(this)
    this.renderRepeatBtn = this.renderRepeatBtn.bind(this)
    this.toggleRepeat = this.toggleRepeat.bind(this)
    this.seekMedia = this.seekMedia.bind(this)
    this.renderVolumeBtn = this.renderVolumeBtn.bind(this)
    this.toggleMuted = this.toggleMuted.bind(this)
    this.renderVolBar = this.renderVolBar.bind(this)
    this.setVolume = this.setVolume.bind(this)
  }
  async connectedCallback() {
    const res = await fetch("components/footer/footer.html");
    const html = await res.text();
    this.innerHTML = html;
    this.classList.add("player");
    this.togglePlayBtn = this.querySelector(".control-toggle-play");
    this.trackImage = this.querySelector(".player-image");
    this.trackTitle = this.querySelector(".player-title");
    this.trackArtist = this.querySelector(".player-artist");
    this.backwardBtn = this.querySelector(".control-btn.backward-btn");
    this.forwardBtn = this.querySelector(".control-btn.forward-btn");
    this.repeatBtn = this.querySelector(".repeat-btn")
    this.oneIcon = this.repeatBtn.querySelector(".one-icon")
    this.currentTimeEl = this.querySelector(".progress-current-time");
    this.durationEl = this.querySelector(".progress-duration");
    this.progressBar = this.querySelector(".progress-bar");
    this.randomBtn = this.querySelector(".random-btn")
    this.redoBtn = this.querySelector(".redo-btn")
    this.volumeBtn = this.querySelector(".volume-btn")
    this.volumeBar = this.querySelector(".volume-bar")
    this.volumeBar.max = 1
    this.volumeBar.step = 0.01
    // render UI
    this.renderTrackInfo(store.currentIndex);
    this.renderTogglePlayBtn(store.isPlaying);
    this.renderRandom(store.isRandom);
    this.renderRepeatBtn(store.repeatMode);
    this.renderVolumeBtn(store.isMuted);
    this.renderVolBar(store.volume);
    this.renderProgress(store.currentTime);
  }
  disconnectedCallback() {
  // Hủy các subscription
  this.unsubPlaying?.();
  this.unsubInfo?.();
  this.unsubRandom?.();
  this.unsubRepeat?.();
  this.unsubMuted?.();
  this.unsubVolBar?.();
  this.unsubCurrentTime?.();

  // Gỡ event listener của các nút
  this.togglePlayBtn?.removeEventListener("click", this.toggleMediaPlaying);
  this.backwardBtn?.removeEventListener("click", this.backwardMedia);
  this.forwardBtn?.removeEventListener("click", this.forwardMedia);
  this.randomBtn?.removeEventListener("click", this.toggleRandom);
  this.repeatBtn?.removeEventListener("click", this.toggleRepeat);
  this.redoBtn?.removeEventListener("click", this.redoMedia);
  this.volumeBtn?.removeEventListener("click", this.toggleMuted);

  // Gỡ event listener của input sliders
  this.progressBar?.removeEventListener("input", this.seekMedia);
  this.volumeBar?.removeEventListener("input", this.setVolume);
}

  formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }
  renderTogglePlayBtn(isPlaying) {
    if (!isPlaying)
      this.togglePlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    else this.togglePlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  }
  renderRepeatBtn(mode) {
    switch (mode) {
        case "off":
            this.repeatBtn.classList.remove("active")
            this.oneIcon.style.display = "none"

            break;
    
        case "one":
            this.repeatBtn.classList.add("active")
            this.oneIcon.style.display = ""
            break;
        case "all":
            this.repeatBtn.classList.add("active")
            this.oneIcon.style.display = "none"

            break;
    }
  }
  toggleMediaPlaying() {
    queueActions.togglePlay();
  }
  toggleRandom() {
    queueActions.toggleRandom()
  }
  toggleRepeat() {
    queueActions.toggleRepeat()
  }
  toggleMuted() {
    queueActions.toggleMute()
  }
  renderRandom(isRandom) {
    this.randomBtn.classList.toggle("active", isRandom)
  }
  renderTrackInfo(index) {
    const track = store.mediaQueue[index];

    if (!track) {
      this.trackImage.src = "placeholder.svg?height=56&width=56";
      this.trackTitle.textContent = "No track";
      this.trackArtist.textContent = "";
      return;
    }

    this.trackImage.src = track.image || "placeholder.svg?height=56&width=56";
    this.trackTitle.textContent = track.name || "Unknown title";
    this.trackArtist.textContent = track.artist || "Unknown artist";
    this.durationEl.textContent = this.formatTime(track.duration) || "0:00"
    this.progressBar.max = track.duration;
    this.progressBar.value = store.currentTime || 0
  }
  renderProgress(time) {
    this.currentTimeEl.textContent = this.formatTime(time) || "0:00"
    this.progressBar.value = time
  }
  renderVolumeBtn(isMuted) {
    if(isMuted) this.volumeBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`
    else this.volumeBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`
  }
  renderVolBar(vol) {
    this.volumeBar.value = vol
  }
  backwardMedia() {
    queueActions.prev();
  }

  forwardMedia() {
    queueActions.next();
  }
  redoMedia() {
    queueActions.redo()
  }
  seekMedia(e) {
    const progress = Number(e.target.value)
    queueActions.seek(progress)
  }
  setVolume(e) {
    const vol = Number(e.target.value)
    queueActions.setVolume(vol)
  }
  reset() {
    // unsubscribe
    this.unsubPlaying?.();
    this.unsubInfo?.();
    this.unsubRandom?.();
    this.unsubRepeat?.();
    this.unsubMuted?.();
    this.unsubVolBar?.();
    this.unsubCurrentTime?.();

    // remove listener
    this.togglePlayBtn?.removeEventListener("click", this.toggleMediaPlaying);
    this.backwardBtn?.removeEventListener("click", this.backwardMedia);
    this.forwardBtn?.removeEventListener("click", this.forwardMedia);
    this.randomBtn?.removeEventListener("click", this.toggleRandom);
    this.repeatBtn?.removeEventListener("click", this.toggleRepeat);
    this.redoBtn?.removeEventListener("click", this.redoMedia);
    this.volumeBtn?.removeEventListener("click", this.toggleMuted);
    this.progressBar?.removeEventListener("input", this.seekMedia);
    this.volumeBar?.removeEventListener("input", this.setVolume);

    // reset UI
    this.style.opacity = 0.5
    this.style.pointerEvents = "none"
    this.trackImage.src = "placeholder.svg?height=56&width=56";
    this.trackTitle.textContent = "No track";
    this.trackArtist.textContent = "";
    this.progressBar.value = 0;
    this.progressBar.max = 0;
    this.currentTimeEl.textContent = "0:00";
    this.durationEl.textContent = "0:00";
    this.volumeBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
    this.randomBtn.classList.remove("active");
    this.repeatBtn.classList.remove("active");
    this.oneIcon.style.display = "none";
  }
  init() {
    // subscription
    this.unsubPlaying = subscribe("isPlaying", isPlaying => this.renderTogglePlayBtn(isPlaying));
    this.unsubInfo = subscribe("currentIndex", index => this.renderTrackInfo(index));
    this.unsubRandom = subscribe("isRandom", isRandom => this.renderRandom(isRandom));
    this.unsubRepeat = subscribe("repeatMode", mode => this.renderRepeatBtn(mode));
    this.unsubMuted = subscribe("isMuted", isMuted => this.renderVolumeBtn(isMuted));
    this.unsubVolBar = subscribe("volume", vol => this.renderVolBar(vol));
    this.unsubCurrentTime = subscribe("currentTime", time => this.renderProgress(time));

    // listener
    this.togglePlayBtn.addEventListener("click", this.toggleMediaPlaying);
    this.backwardBtn.addEventListener("click", this.backwardMedia);
    this.forwardBtn.addEventListener("click", this.forwardMedia);
    this.randomBtn.addEventListener("click", this.toggleRandom);
    this.repeatBtn.addEventListener("click", this.toggleRepeat);
    this.redoBtn.addEventListener("click", this.redoMedia);
    this.volumeBtn.addEventListener("click", this.toggleMuted);
    this.progressBar.addEventListener("input", this.seekMedia);
    this.volumeBar.addEventListener("input", this.setVolume);
    // Set UI
    
    this.style.opacity = 1
    this.style.pointerEvents = ""
  }

}
customElements.define("spotify-footer", Footer);
