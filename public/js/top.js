//menu screen component
var receiver_start_button = document.getElementById("receiver_start_button");
var sender_start_button = document.getElementById("sender_start_button");

var top_container = document.getElementById("top_container");

var listener_container = document.getElementById("listener_container");

var receiver_container = document.getElementById("receiver_container");
var receiver_time_count = document.getElementById("time_count");

var system_timer_reset = document.getElementById("timer_reset_button");
var system_timer_start = document.getElementById("timer_start_button");
var system_on = document.getElementById("system_on_button");
var system_off = document.getElementById("system_off_button");

var receiver_canvas = document.getElementById("receiver_canvas");
var receiver_context = receiver_canvas.getContext("2d");
receiver_canvas_width = 600;
receiver_canvas_height = 600;
receiver_canvas.width = receiver_canvas_width;
receiver_canvas.height = receiver_canvas_height;

var cursor_positions = [];
var velocity_ratio = 0.05;

var is_system_condition = true;
var is_top = true;

var is_speech_starting = true;
var max_time = 60;
var time_count = max_time;

//listener screen component
var video;
var canvas;
var media;
var tracker;

var prev_pos_x = 0.0;
var prev_pos_y = 0.0;
var prev_time;
var coef = 0.5;

var message_json = {
    label: "sender",
    x: 0,
    y: 0,
    id: 0
};

var admin_message_json = {
    label: "admin",
    mode: 1
};

//menu screen
receiver_start_button.addEventListener("click", switchReceiver);
sender_start_button.addEventListener("click", switchListener);

function switchReceiver() {
    top_container.style.visibility = "hidden";
    receiver_container.style.visibility = "visible";
    is_top = false;
    startReceiver();
}

function switchListener() {
    top_container.style.visibility = "hidden";
    listener_container.style.visibility = "visible";
    is_top = false;
    startListener();
}

//listener screen
function startListener() {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    var message_string = JSON.stringify(message_json);
    while(ws == null) {
        console.log("cccccccccccc");
    }
    if (ws != null) {
        console.log("already connected");
    }
    ws.send(message_string);
    message_json.label = "head_velocity";
    ws.addEventListener("message", function(e) {
        // console.log(e.data);
        var message_string = JSON.parse(e.data);
        console.log(message_string.label);
        if (message_string.label == "server") {
            message_json.id = message_string.your_id;
        } else if (message_string.label == "disconnected_user") {
            // console.log(e.data);
            // if (message_string.id < message_json.id) {
            //     message_json.id -= 1;
            // }
        }
    });

    media = navigator.mediaDevices.getUserMedia({
        video: {facingMode: "user"},
        audio: false
    });
    media.then((stream) => {
        video.srcObject = stream;
    });
    
    tracker = new clm.tracker();
    tracker.init(pModel);
    tracker.start(video);

    prev_time = new Date();
    drawLoop();
}

function drawLoop() {
    requestAnimationFrame(drawLoop);
    var positions = tracker.getCurrentPosition();
    if (positions != undefined) {
        showData(positions);
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    // tracker.draw(canvas);
}

function showData(pos) {
    var str = "";
    //62 is a nose tip position
    var current_pos_x = pos[62][0];
    var current_pos_y = pos[62][1];
    var current_time = new Date();
    var time_diff = current_time.getTime() - prev_time.getTime();
    var velocity_x = (current_pos_x - prev_pos_x) / time_diff * 400.0 * coef;
    var velocity_y = (current_pos_y - prev_pos_y) / time_diff * 4000.0 * coef;
    str = "feature" + 62 + ": (" + velocity_x + ", " + velocity_y + ")";
    // UpdateHeadDot(velocity_x, velocity_y, 0);
    message_json.x = velocity_x;
    message_json.y = velocity_y;
    ws.send(JSON.stringify(message_json));
    prev_pos_x = current_pos_x;
    prev_pos_y = current_pos_y;
    prev_time = current_time;
    // dat.innerHTML = str;
}

//receiver menu
function startReceiver() {
    system_timer_reset.addEventListener("click", SystemTimerReset);
    system_timer_start.addEventListener("click", SystemTimerStart);
    system_on.addEventListener("click", SystemOn);
    system_off.addEventListener("click", SystemOff);

    message_json.label = "receiver";
    var message_string = JSON.stringify(message_json);
    while(ws == null) {
        console.log("cccccccccccc");
    }
    if (ws != null) {
        console.log("already connected");
    }
    ws.send(message_string);
    ws.addEventListener("message", function(e) {
        // console.log(e.data);
        var server_message = JSON.parse(e.data);
        console.log(server_message.label);
        if (server_message.label == "server") {
            message_json.id = server_message.your_id;
        } else if (server_message.label == "head_velocity") {
            var sender_id = server_message.id;
            while (sender_id > cursor_positions.length) {
                cursor_positions.push([0, 0]);
            }

            receiver_context.fillStyle = "rgba(0, 0, 0, 0.05)";
            receiver_context.fillRect(0, 0, receiver_canvas_width, receiver_canvas_height);

            var next_velocity = [server_message.x, server_message.y];
            var old_velocity = cursor_positions[sender_id-1];
            var new_x = next_velocity[0] * velocity_ratio + old_velocity[0] * (1-velocity_ratio);
            var new_y = next_velocity[1] * velocity_ratio + old_velocity[1] * (1-velocity_ratio);
            cursor_positions[sender_id-1] = [new_x, new_y];
            receiver_context.beginPath();
            var cursor_pos_x = cursor_positions[sender_id-1][0] + receiver_canvas_width/2;
            var cursor_pos_y = cursor_positions[sender_id-1][1] + receiver_canvas_height/2;
            receiver_context.arc(cursor_pos_x, cursor_pos_y, 4, 0, Math.PI*2, false);
            receiver_context.fillStyle = "#3cb371";
            receiver_context.fill();
        } else if (server_message.label == "disconnected_user") {
            // console.log(e.data);
            // for (var i=0; i<cursor_num; i++) {
            //     dot_element_list[server_message.id][i].style.opacity = 0;
            // }
            // // dot_element_list[server_message.id-1].remove();
            // // dot_element_list.splice(server_message.id-1,1);
        } else if (server_message.label == "admin") {
            if (server_message.mode == 0) {
                is_system_condition = false;
            } else {
                is_system_condition = true;
            }
        }
    });

    setInterval(UpdateTimer, 1000);
}

function UpdateTimer() {
    if (is_speech_starting && time_count > 0) {
        time_count -= 1;
        receiver_time_count.innerHTML = time_count;
    }
    if (time_count <= 0) {
        is_speech_starting = false;
    }
}

function SystemTimerReset() {
    time_count = max_time;
    receiver_time_count.innerHTML = time_count;
    is_speech_starting = false;
}

function SystemTimerStart() {
    is_speech_starting = true;
}

function SystemOn() {
    admin_message_json.mode = 1;
    console.log(admin_message_json);
    var admin_message_string = JSON.stringify(admin_message_json);
    ws.send(admin_message_string);
}

function SystemOff() {
    admin_message_json.mode = 0;
    console.log(admin_message_json);
    var admin_message_string = JSON.stringify(admin_message_json);
    ws.send(admin_message_string);
}
