import { addRoute, initRouter, navigate } from "./router.js";
import httpRequest from "./utils/HttpRequest.js";
import "./components/index.js";
import { getUser } from "./utils/getUser.js";
import { staticStoreUI, store, subscribe } from "./store/store.js";
import { queueActions } from "./store/queueActions.js";
import NotifyToast from "./components/toast/NotifyToast.js";
import "./store/player.js"
function cleanupFooter() {
  const footer = document.querySelector("spotify-footer")
  if(!footer) return
  subscribe("mediaQueue", queue => {
    if(!queue?.length) {
      footer.reset()
    } else {
      footer.init()
    }
  })
  if (!store.mediaQueue?.length) {
    footer.reset();
  } else {
    footer.init();
  }
}
function renderToMain(...elements) {
  const main = document.querySelector(".main-content");
  main.innerHTML = "";
  elements.forEach((el) => main.appendChild(el));
}

function renderHome() {
  renderToMain(document.createElement("spotify-home"));
}

function renderPlaylist({ params }) {
  renderToMain(
    Object.assign(document.createElement("spotify-playlist"), {
      playlistId: params.id,
    })
  );
}
function renderArtist({ params }) {
  renderToMain(
    Object.assign(document.createElement("spotify-artist"), {
      artistId: params.id,
    })
  );
}
function renderAlbum({ params }) {
  renderToMain(
    Object.assign(document.createElement("spotify-album"), {
      albumId: params.id,
    })
  );
}
async function getLibraryData(userId) {
  store.libraryData = [];

  if (!userId) return

  const requests = [
    { name: "Followed playlists", key: "playlists", url: "me/playlists/followed", type: "playlist" },
    { name: "Your playlists", key: "playlists", url: "me/playlists", type: "playlist" },
    { name: "Followed artists", key: "artists", url: "me/following", type: "artist" },
    { name: "Liked Albums", key: "albums", url: "me/albums/liked", type: "album"}

  ];

  const results = await Promise.allSettled(
    requests.map((r) => httpRequest.get(r.url))
  );

  results.forEach((res, i) => {
    const { name, key, type } = requests[i];
    if (res.status === "fulfilled" && res.value?.status === 200) {
      const data = res.value?.[key]?.map((v) => ({ ...v, type: type }));
      if (data?.length) store.libraryData = [...store.libraryData, ...data];
    } else {
        NotifyToast.show({
          message: res.value?.message || `Failed to fetch ${name}`,
          type: "fail",
          duration: 3000,
        });
    }
  });
}

async function getAllTracks() {
  try {
    const res = await httpRequest.get("tracks", { skipAuth: true });
    if (res.tracks && res.tracks.length > 0) {
      return res.tracks;
    } else {
        NotifyToast.show({
          message: "There are currently no songs on the server.",
          type: "info",
          duration: 300,
        });
    }
  } catch (error) {
    NotifyToast.show({
      message: error?.message || "Error while downloading song",
      type: "fail",
      duration: 3000,
    });
    return [];
  }
}
async function getTrendingArtists() {
  try {
    const res = await httpRequest.get("artists/trending", {skipAuth: true})
    
    if (res.status === 200 && res.artists) {
      store.trendingArtists = res.artists
    }
  } catch (error) {
    NotifyToast.show({
      message: error.message || "Error while downloading trending artists",
      type: "fail"
    })
  }
}
async function getPopularAlbums () {
  try {
    const res = await httpRequest.get("albums/popular", {skipAuth: true})
    if(res.status === 200 && res.albums) {
      store.popularAlbums = res.albums
    }
  } catch (error) {
    NotifyToast.show({
      message: error.message || "Error while downloading popular albums",
      type: "fail"
    })
  }
}
async function getPopularTracks () {
  try {
    const res = await httpRequest.get("tracks/popular", {skipAuth: true})
    if(res.status === 200 && res.tracks) {
      store.popularTracks = res.tracks
      // const mediaQueue = res.tracks.map(track => ({
      //   audio_url: track.audio_url,
      //   image: track.image_url,
      //   name: track.title,
      //   artist: track.artist_name,
      //   duration: track.duration
      // }))
      // queueActions.addTracks(mediaQueue)
      // store.currentIndex = 0
    }
  } catch (error) {
    NotifyToast.show({
      message: error.message || "Error while downloading popular tracks",
      type: "fail"
    })
  }
}
async function getTrendingTracks () {
  try {
    const res = await httpRequest.get("tracks/trending", {skipAuth: true})
    if(res.status === 200 && res.tracks) {
      store.trendingTracks = res.tracks
    }
  } catch (error) {
    NotifyToast.show({
      message: error.message || "Error while downloading trending tracks",
      type: "fail"
    })
  }
}
// Auth Modal Functionality
document.addEventListener("DOMContentLoaded", async function () {
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault()
  })
  // Get DOM elements
  if (localStorage.getItem("token")) {
    await getUser();
  } else {
    store.user = null;
    store.stats = null;
    store.userId = null;
  }
  getTrendingArtists()
  getPopularAlbums()
  getPopularTracks()
  getTrendingTracks()
  subscribe("userId", async (userId) => getLibraryData(userId));
  getLibraryData(store.userId);
  store.tracks = await getAllTracks();
  cleanupFooter()
  // Run
  addRoute("/", renderHome);
  addRoute("/playlist/:id", renderPlaylist);
  addRoute("/artist/:id", renderArtist);
  addRoute("/album/:id", renderAlbum)
  initRouter();
});
export async function refreshLibrary() {
  if (store.userId) {
    await getLibraryData(store.userId);
  }
}
