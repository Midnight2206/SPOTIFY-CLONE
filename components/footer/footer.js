export default class Footer extends HTMLElement {
    constructor() {
        super()
    }
    async connectedCallback() {
        const res = await fetch('components/footer/footer.html');
        const html = await res.text();
        this.innerHTML = html;
    }
}
customElements.define("spotify-footer", Footer)