let host = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(host);
let el;

var nod_speaker_container = document.getElementById("nod_speaker_container");
var nod_audience_container = document.getElementById("nod_audience_container");

nod_speaker_container.style.visibility = "hidden";
nod_audience_container.style.visibility = "hidden";

function startNod(client_type_val) {
    console.log("start nod: ", client_type_val);
    if (client_type_val == "audience") {
        nod_audience_container.style.visibility = "visible";
        startNodAudience();
    } else {
        nod_speaker_container.style.visibility = "visible";
        startNodSpeaker();
    }
}

var nod_audience_video;
var nod_audience_canvas;
var nod_audience_context;
var nod_audience_media;
var nod_audience_tracker;

var nod_prev_pos_x = 0.0;
var nod_prev_pos_y = 0.0;
var nod_prev_time;
var nod_coef = 0.5;

var nod_audience_message_json = {
    publisher: "nod_audience",
    label: "init",
    x: 0,
    y: 0,
    id: 0
};

function startNodAudience() {
    nod_audience_video = document.getElementById("nod_audience_video");
    nod_audience_canvas = document.getElementById("nod_audience_canvas");
    nod_audience_context = nod_audience_canvas.getContext("2d");

    var nod_audience_message_str = JSON.stringify(nod_audience_message_json);
    while (ws == null) {
        console.log("connecting ...");
    }
    if (ws != null) {
        console.log("already connected");
    }
    ws.send(nod_audience_message_str);
    nod_audience_message_json.label = "data";
    ws.addEventListener("message", function(e) {
        var received_msg = JSON.parse(e.data);
        if (received_msg.publisher == "server") {
            nod_audience_message_json.id = received_msg.your_id;
        }
    });

    nod_audience_media = navigator.mediaDevices.getUserMedia({
        video: {facingMode: "user"},
        audio: false
    });

    nod_audience_media.then((stream) => {
        nod_audience_video.srcObject = stream;
    });

    nod_audience_tracker = new clm.tracker();
    nod_audience_tracker.init(pModel);
    nod_audience_tracker.start(nod_audience_video);

    nod_prev_time = new Date();
    nodDrawLoop();
}

function nodDrawLoop() {
    requestAnimationFrame(nodDrawLoop);
    var positions = nod_audience_tracker.getCurrentPosition();
    if (positions != undefined) {
        showData(positions);
    }
    nod_audience_context.clearRect(0, 0, nod_audience_canvas.width, nod_audience_canvas.height);
    // tracker.draw(nod_audience_canvas);
}

function showData(pos) {
    var str = "";
    //62 is a nose tip position
    var current_pos_x = pos[62][0];
    var current_pos_y = pos[62][1];
    var current_time = new Date();
    var time_diff = current_time.getTime() - nod_prev_time.getTime();
    var velocity_x = (current_pos_x - nod_prev_pos_x) / time_diff * 400.0 * nod_coef;
    var velocity_y = (current_pos_y - nod_prev_pos_y) / time_diff * 4000.0 * nod_coef;
    str = "feature" + 62 + ": (" + velocity_x + ", " + velocity_y + ")";
    // UpdateHeadDot(velocity_x, velocity_y, 0);
    nod_audience_message_json.x = velocity_x;
    nod_audience_message_json.y = velocity_y;
    ws.send(JSON.stringify(nod_audience_message_json));
    nod_prev_pos_x = current_pos_x;
    nod_prev_pos_y = current_pos_y;
    nod_prev_time = current_time;
    // dat.innerHTML = str;
}

function startNodSpeaker() {

}