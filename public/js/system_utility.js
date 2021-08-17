var system_utility_container = document.getElementById("system_utility_container");

var timer_reset_button = document.getElementById("timer_reset_button");
var timer_start_button = document.getElementById("timer_start_button");
var system_on_button = document.getElementById("system_on_button");
var system_off_button = document.getElementById("system_off_button");

var receiver_time_count = document.getElementById("time_count");

var nod_speaker_canvas = document.getElementById("nod_speaker_canvas");
var gaze_speaker_canvas = document.getElementById("gaze_visualization_canvas");

var is_speech_starting = true;
var max_time = 120;
var time_count = max_time;

function startSystemUtility() {
    console.log("start system utility");
    system_utility_container.style.visibility = "visible";

    timer_reset_button.addEventListener("click", systemTimerReset);
    timer_start_button.addEventListener("click", systemTimerStart);
    system_on_button.addEventListener("click", systemOn);
    system_off_button.addEventListener("click", systemOff);

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

function systemTimerReset() {
    time_count = max_time;
    receiver_time_count.innerHTML = time_count;
    is_speech_starting = false;
}

function systemTimerStart() {
    is_speech_starting = true;
}

function systemOn() {
    nod_speaker_canvas.style.opacity = "1.0";
    gaze_visualization_canvas.style.opacity = "1.0";
}

function systemOff() {
    nod_speaker_canvas.style.opacity = "0.0";
    gaze_visualization_canvas.style.opacity = "0.0";
}