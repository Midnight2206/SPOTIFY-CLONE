const listeners = new Map(); // Khởi tạo nơi chứa các callback khi state thay đổi
// Tạo hàm để đăng ký các listener tương ứng với mỗi state
export function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key).add(callback);
  // Trả về hàm unsubscribe để gỡ bỏ listener
  // Do mỗi hàm subccribe gắn với key và callback riêng nên trả unsubscribe trong này sẽ hiệu quả hơn
  return () => {
    listeners.get(key).delete(callback);
    if (listeners.get(key).size === 0) {
      listeners.delete(key);
    }
  };
}

// Object lưu trữ state
const state = {
  authModal_status: "close",
  authModal_form: "login",
  user: null,
  userId: null,
  stats: null,
  libraryData: [],
  libraryItemIdActive: "",
  tracks: [],
  trendingArtists: [],
  popularAlbums: [],
  popularTracks: [],
  trendingTracks: [],
  mediaQueue: [],
  currentIndex: -1,
  isPlaying: false,
  isRandom: false,
  repeatMode: "off",
  volume: 0.5,
  isMuted: false,
  process: 0,
  duration: 0,
  currentTime: 0
};
// Bọc state vào proxy để theo dõi sự thay đổi
// Đối số đầu tiên của proxy là object lưu trữ các trạng thái ban đầu
// Đối số thứ 2 là handler chứa các bẫy get, set
// +Get: xảy ra khi truy cập proxy.key dùng để log, bảo vệ, định dạng, lazy-load
// +Set: xảy ra khi gán proxy.key = value dùng để theo dõi thay đổi, cập nhật UI, trigger
// +Target là obj gốc chứa state
const proxy = new Proxy(state, {
  get(target, key) {
    // Bạn có thể log truy cập ở đây nếu muốn
    return target[key];
  },
  set(target, key, value) {
    const oldValue = target[key];
    if (oldValue !== value) {
      target[key] = value;

      //Gọi tất cả các hàm lắng nghe với key tương ứng
      const callbacks = listeners.get(key);
      if (callbacks) {
        callbacks.forEach((cb) => cb(value, oldValue));
      }
      // Log để debug
      // console.log(`[store] ${String(key)}:`, oldValue, "→", value);
    }
    //Thông báo gán state thành công
    return true;
  },
});
export const store = proxy;
export const staticStoreUI = {
  mediaPlayer: null,
  playlist: {
    visibleCols: {
      status: true,
      title: true,
      album: true,
      date: true,
      duration: true,
      menu: true,
    },
    viewModeTracksCompact: "false",
  },
  artist: {
    visibleCols: {
      status: true,
      title: true,
      album: true,
      listeners: true,
      duration: true,
      menu: true,
    },
    viewModeTracksCompact: "false",
  },
  album: {
    visibleCols: {
      status: true,
      title: true,
      duration: true,
      menu: true,
    },
    viewModeTracksCompact: "false",
  },
};
