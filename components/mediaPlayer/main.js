import MediaPlayer from "./MediaPlayer.js";
import TogglePlay from "./TogglePlay.js";
import MediaSwitch from "./MediaSwitch.js";
import MediaSeek from "./MediaSeek.js";
import VolumeControl from "./Volume.js";
import RandomBtn from "./RandomBtn.js";
import RepeatControl from "./RepeatControl.js";

customElements.define('media-player', MediaPlayer);
customElements.define('media-toggle', TogglePlay);
customElements.define('media-switch', MediaSwitch);
customElements.define('media-seek', MediaSeek);
customElements.define('media-volume', VolumeControl);
customElements.define('media-random', RandomBtn);
customElements.define('media-repeat', RepeatControl);
