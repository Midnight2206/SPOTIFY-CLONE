import { store } from "./store.js";
import player from "./player.js";
import NotifyToast from "../components/toast/NotifyToast.js";
let isSwitching = false;
export const queueActions = {
  addTrack(track) {
    store.mediaQueue = [...store.mediaQueue, track];
    NotifyToast.show({ message: `Đã thêm: ${track.title}`, type: "success" });
  },
  addTracks(tracks) {
    store.mediaQueue = [...store.mediaQueue, ...tracks];
    NotifyToast.show({
      message: `Đã thêm ${tracks.length} bài vào queue`,
      type: "success",
    });
  },
  setQueue(tracks) {
    store.mediaQueue = [...tracks]
  },
  removeTrack(index) {
    if (index < 0 || index >= store.mediaQueue.length) return;
    const removed = store.mediaQueue[index];
    store.mediaQueue = store.mediaQueue.filter((_, i) => i !== index);
    if (index === store.currentIndex) {
      this.next();
    }
    NotifyToast.show({ message: `Đã xóa: ${removed.title}`, type: "warn" });
  },
  clearQueue() {
    store.mediaQueue = [];
    store.currentIndex = -1;
    player.stop();
  },
  async playTrack(index) {
    if (isSwitching) return;
    isSwitching = true;

    const { mediaQueue } = store;
    if (index < 0 || index >= mediaQueue.length) {
      NotifyToast.show({ message: "Không tìm thấy bài hát", type: "warn" });
      isSwitching = false;
      return;
    }

    store.currentIndex = index;

    try {
      await player.play();
    } catch (err) {
      console.error("Play failed:", err);
    } finally {
      setTimeout(() => { isSwitching = false }, 300);
    }
  },
  togglePlay() {
    if (store.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  },

  next() {
    const { mediaQueue, currentIndex, isRandom, repeatMode } = store;

    if (mediaQueue.length === 0) return;

    let nextIndex = currentIndex;

    if (isRandom) {
      do {
        nextIndex = Math.floor(Math.random() * mediaQueue.length);
      } while (nextIndex === currentIndex && mediaQueue.length > 1);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= mediaQueue.length) {
        if (repeatMode === "all") nextIndex = 0;
        else return player.stop();
      }
    }
    this.playTrack(nextIndex);
  },

  prev() {
    const { mediaQueue, currentIndex, isRandom } = store;
    if (mediaQueue.length === 0) return;

    let prevIndex = currentIndex;

    if (isRandom) {
      do {
        prevIndex = Math.floor(Math.random() * mediaQueue.length);
      } while (prevIndex === currentIndex && mediaQueue.length > 1);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = 0;
    }

    this.playTrack(prevIndex);
  },

  toggleRandom() {
    store.isRandom = !store.isRandom;
    NotifyToast.show({
      message: store.isRandom ? "Bật phát ngẫu nhiên" : "Tắt phát ngẫu nhiên",
      type: "info",
    });
  },

  toggleRepeat() {
    const modes = ["off", "all", "one"];
    const i = modes.indexOf(store.repeatMode);
    store.repeatMode = modes[(i + 1) % modes.length];
    NotifyToast.show({ message: `Repeat: ${store.repeatMode}`, type: "info" });
  },
  redo() {
    player.redo()
  },
  setVolume(vol) {
    player.setVolume(vol);
  },

  toggleMute() {
    store.isMuted = !store.isMuted;
  },
  seek(progress) {
    player.seek(progress);
  },
};
