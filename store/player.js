import { store, subscribe } from "./store.js";
import NotifyToast from "../components/toast/NotifyToast.js";

class Player {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this._dragseek = false;
    this._dragvolume = false;
    this._bindEvents();
    subscribe("currentIndex", (newIndex) => {
      if (newIndex >= 0 && store.mediaQueue[newIndex]) {
        store.currentTime = 0;
        this._loadTrack(store.mediaQueue[newIndex]);
      }
    });

    subscribe("volume", (v) => {
      if (!this._dragvolume) this.audio.volume = v;
    });

    subscribe("isMuted", (muted) => {
      this.audio.muted = muted;
    });
    subscribe("currentTime", (time) => {
      if (!this._dragseek && this.audio.currentTime !== time) {
        this.audio.currentTime = time;
      }
    });
  }

  _bindEvents() {
    this.audio.addEventListener("timeupdate", () => {
      if (this.audio.duration && !this._dragseek) {
        store.currentTime = this.audio.currentTime;
        store.duration = this.audio.duration;
        store.progress = (this.audio.currentTime / this.audio.duration) * 100;
      }
    });

    this.audio.addEventListener("ended", () => this._handleEnded());

    this.audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      NotifyToast.show({
        message: "Không phát được bài hát này",
        type: "fail",
      });
      this.next();
    });
  }

  _loadTrack(track) {
    if (!track || !track.audio_url) {
      NotifyToast.show({ message: "Bài hát không hợp lệ", type: "warn" });
      return;
    }

    this.audio.src = track.audio_url;

    this.audio.addEventListener(
      "loadeddata",
      () => {
        this.audio.currentTime = store.currentTime || 0;
        if (store.isPlaying) this.play();
      },
      { once: true }
    );
  }

  play() {
    if (!this.audio.src) {
      NotifyToast.show({ message: "Chưa có bài hát để phát", type: "info" });
      return;
    }
    this.audio.play().then(() => (store.isPlaying = true))
      .catch((err) => {
        console.error(err);
        NotifyToast.show({ message: "Không thể phát nhạc", type: "fail" });
      });
  }

  pause() {
    this.audio.pause();
    store.isPlaying = false;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    store.isPlaying = false;
  }

  togglePlay() {
    if (store.isPlaying) this.pause();
    else this.play();
  }

  redo() {
    this.audio.currentTime = 0;
    store.currentTime = 0;
    if (!store.isPlaying) this.play();
  }

  next() {
    const { mediaQueue, currentIndex, isRandom, repeatMode } = store;

    if (isRandom) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * mediaQueue.length);
      } while (nextIndex === currentIndex && mediaQueue.length > 1);
      store.currentIndex = nextIndex;
    } else {
      if (currentIndex < mediaQueue.length - 1) store.currentIndex = currentIndex + 1;
      else if (repeatMode === "all") store.currentIndex = 0;
      else store.isPlaying = false;
    }
  }

  prev() {
    const { mediaQueue, currentIndex, isRandom } = store;

    if (isRandom) {
      let prevIndex;
      do {
        prevIndex = Math.floor(Math.random() * mediaQueue.length);
      } while (prevIndex === currentIndex && mediaQueue.length > 1);
      store.currentIndex = prevIndex;
    } else {
      store.currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    }
  }

  _handleEnded() {
    const { repeatMode } = store;
    if (repeatMode === "one") {
      this.audio.currentTime = 0;
      this.play();
    } else {
      this.next();
    }
  }
  seek(progress) {
    if (this.audio.duration) {
      this._dragseek = true;
      this.audio.currentTime = progress;
      this._dragseek = false;
    }
  }

  setVolume(value) {
    this._dragvolume = true;
    this.audio.volume = value
    this._dragvolume = false;
  }

}

const player = new Player();
export default player;
