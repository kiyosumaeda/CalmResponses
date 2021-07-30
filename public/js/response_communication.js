let host = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(host);

function checkConnection() {
    while (ws == null) {
        console.log("connecting ...");
    }
    if (ws != null) {
        console.log("already connected");
    }
}