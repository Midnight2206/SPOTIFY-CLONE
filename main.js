import { addRoute, initRouter, navigate } from "./router.js";
import httpRequest from "./utils/HttpRequest.js";
import './components/index.js'
import {getUser} from './utils/getUser.js'
import { store, subscribe } from "./store/store.js";
import NotifyToast from "./components/toast/NotifyToast.js";
function renderToMain(...elements) {
    const main = document.querySelector(".main-content");
    main.innerHTML = "";
    elements.forEach(el => main.appendChild(el));
}
function renderHome() {
    renderToMain(
        document.createElement("spotify-home")
    );
}
function renderPlaylist({ params }) {
    renderToMain(
        Object.assign(document.createElement("spotify-playlist"), { playlistId: params.id })
    );
}
addRoute("/", renderHome);
addRoute("/playlist/:id", renderPlaylist);
initRouter();
// Auth Modal Functionality
document.addEventListener("DOMContentLoaded", async function () {
    
    // Get DOM elements
    if (localStorage.getItem("token")) {
        await getUser();
    } else {
        store.user = null;
        store.stats = null;
        store.userId = null;
    }
    subscribe("userId",  async (userId) => getLibraryData(userId));
    getLibraryData(store.userId);
    store.tracks = await getAllTracks()
});
async function getLibraryData(userId) {
    store.libraryData = [];

    if (!userId) {
        store.authModal_status = "open";
        store.authModal_form = "login";
        return;
    }

    const requests = [
        { name: "Followed playlists", key: "playlists", url: "me/playlists/followed" },
        { name: "Your playlists", key: "playlists", url: "me/playlists" },
        { name: "Followed artists", key: "artists", url: "me/artists" }
    ];

    const results = await Promise.allSettled(
        requests.map(r => httpRequest.get(r.url))
    );

    results.forEach((res, i) => {
        const { name, key } = requests[i];
        if (res.status === "fulfilled" && res.value?.status === 200) {
            const data = res.value?.[key]?.map(v => ({...v, type: key}))
            if(data?.length) store.libraryData = [...store.libraryData, ...data]
        } else {
            NotifyToast.show({
                message: (res.value?.message) || `Failed to fetch ${name}`,
                type: "fail",
                duration: 3000
            });
        }
    });
}
async function getAllTracks() {
    try {
        const res = await httpRequest.get("tracks", {skipAuth: true})
        if(res.tracks && res.tracks.length > 0) {
            return res.tracks
        } else {
            NotifyToast.show({
                message: "There are currently no songs on the server.",
                type: "info",
                duration: 300
            })
        }
    } catch (error) {
        
        NotifyToast.show({
            message: error?.message || "Error while downloading song",
            type: "fail",
            duration: 3000
        })
        return []
    }
}