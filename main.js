import httpRequest from "./utils/HttpRequest.js";
import './components/index.js'
import {getUser} from './utils/getUser.js'
import { store, subscribe } from "./store/store.js";
import NotifyToast from "./components/toast/NotifyToast.js";

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
});
async function getLibraryData(userId) {
    store.libraryData = []
        if (userId) {
            try {
                const resPlaylists = await httpRequest.get("me/playlists");
                if (resPlaylists.status === 200) {
                    const playlists = resPlaylists.playlists.map((playlist) => {
                        playlist.type = "playlist";
                        return playlist;
                    });
                    store.libraryData = [...playlists];
                } else {
                    NotifyToast.show({
                        message: resPlaylists.message || "Failed to fetch playlists",
                        type: "fail",
                        duration: 3000,
                    });
                }
                // const resArtists = await httpRequest.get("me/artists");
                // console.log(resArtists);
                // if (resArtists.status === 200) {
                //     store.myArtists = resArtists.artists || [];
                // } else {
                //     NotifyToast.show({
                //         message: resArtists.message || "Failed to fetch artists",
                //         type: "fail",
                //         duration: 3000,
                //     });
                // }
            } catch (error) {
                console.error("Error fetching playlists:", error);
            }
        } else {
            store.authModal_status = "open";
            store.authModal_form = "login";
        }
}