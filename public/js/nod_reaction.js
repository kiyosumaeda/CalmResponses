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

var nod_audience_data = new NodAudienceData();

var nod_speaker_data = new NodSpeakerData();
var nod_record_label = ["timestamp", "user_id", "reaction_type", "v_x", "v_y"];
var reaction_recorder = new ReactionRecorder(nod_record_label);

function checkConnection() {
    while (ws == null) {
        console.log("connecting ...");
    }
    if (ws != null) {
        console.log("already connected");
    }
}

function startNodAudience() {
    nod_audience_video = document.getElementById("nod_audience_video");
    nod_audience_canvas = document.getElementById("nod_audience_canvas");
    nod_audience_context = nod_audience_canvas.getContext("2d");

    var nod_audience_message_str = JSON.stringify(nod_audience_data);
    checkConnection();
    ws.send(nod_audience_message_str);
    ws.addEventListener("message", function(e) {
        var received_msg = JSON.parse(e.data);
        if (received_msg.name == NAME.SERVER) {
            nod_audience_data.user_id = received_msg.your_id;
            nod_audience_data.status = STATUS.DATA;
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
    var velocity_y = (current_pos_y - nod_prev_pos_y) / time_diff * 6000.0 * nod_coef;
    str = "feature" + 62 + ": (" + velocity_x + ", " + velocity_y + ")";
    // UpdateHeadDot(velocity_x, velocity_y, 0);

    nod_audience_data.updateData([velocity_x, velocity_y]);
    ws.send(JSON.stringify(nod_audience_data));
    nod_prev_pos_x = current_pos_x;
    nod_prev_pos_y = current_pos_y;
    nod_prev_time = current_time;
    // dat.innerHTML = str;
}

var nod_speaker_canvas = document.getElementById("nod_speaker_canvas");
var nod_speaker_context = nod_speaker_canvas.getContext("2d");
nod_speaker_canvas_width = 600;
nod_speaker_canvas_height = 400;
nod_speaker_canvas.width = nod_speaker_canvas_width;
nod_speaker_canvas.height = nod_speaker_canvas_height;

var cursor_positions = [];
var cursor_x_offset = [];
var x_offset_min = -100.0;
var x_offset_max = 100.0;
var velocity_ratio = 0.05;

function startNodSpeaker() {
    document.body.addEventListener("keydown", event => {
        if (event.key == "s") {
            reaction_recorder.saveRecord();
        }
    })

    var nod_speaker_msg_str = JSON.stringify(nod_speaker_data);
    checkConnection();
    ws.send(nod_speaker_msg_str);
    ws.addEventListener("message", function(e) {
        var received_msg = JSON.parse(e.data);
        // console.log(received_msg);
        if (received_msg.name == NAME.SERVER) {
            nod_speaker_msg_str.id = received_msg.your_id;
        } else if (received_msg.status == STATUS.DATA) {
            var audience_id = received_msg.user_id;
            while (audience_id > cursor_positions.length) {
                cursor_positions.push([0, 0]);
                var random_x_offset = Math.random() * (x_offset_max - x_offset_min) + x_offset_min;
                cursor_x_offset.push(random_x_offset);
            }

            reaction_recorder.updateRecordList([received_msg.user_id, received_msg.reaction_type, received_msg.v_x, received_msg.v_y]);

            var next_velocity = [received_msg.v_x, received_msg.v_y];
            var old_velocity = cursor_positions[audience_id-1];
            var new_x = next_velocity[0] * velocity_ratio + old_velocity[0] * (1-velocity_ratio);
            var new_y = next_velocity[1] * velocity_ratio + old_velocity[1] * (1-velocity_ratio);
            cursor_positions[audience_id-1] = [new_x, new_y];

            nod_speaker_context.beginPath();
            
            var cursor_pos_x = cursor_positions[audience_id-1][0] + nod_speaker_canvas_width/2 + cursor_x_offset[audience_id-1];
            var cursor_pos_y = cursor_positions[audience_id-1][1] + nod_speaker_canvas_height/2;

            nod_speaker_context.arc(cursor_pos_x, cursor_pos_y, 4, 0, Math.PI*2, false);
            nod_speaker_context.fillStyle = "#FF404F";
            nod_speaker_context.fill();
        }
    });

    setInterval(fillCanvas, 20);
}

function fillCanvas() {
    if (cursor_positions.length > 0) {
        nod_speaker_context.fillStyle = "rgba(0, 0, 0, 0.05)";
        nod_speaker_context.fillRect(0, 0, nod_speaker_canvas_width, nod_speaker_canvas_height);
    }
}