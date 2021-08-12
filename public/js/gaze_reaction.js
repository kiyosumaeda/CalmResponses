var is_speaker = false;

var gaze_speaker_container = document.getElementById("gaze_speaker_container");
var gaze_audience_container = document.getElementById("gaze_audience_container");

gaze_speaker_container.style.visibility = "hidden";
gaze_audience_container.style.visibility = "hidden";

var gaze_audience_calibration_container = document.getElementById("gaze_audience_calibration");
var gaze_audience_images = document.getElementById("gaze_audience_images");
var audience_image = document.getElementById("audience_image1");
var image_name_list = ["world_map1.png", "world_map2.png"];
var current_image_index = 0;
gaze_audience_images.style.visibility = "hidden";

var gaze_button_num = 9;
var gaze_calibration_buttons;
var gaze_button_list = new GazeButtonList(gaze_audience_images, gaze_audience_calibration_container);
var max_press_count = 4;

var gaze_audience_data = new GazeAudienceData();

var gaze_speaker_data = new GazeSpeakerData();
var gaze_record_label = ["timestamp", "user_id", "reaction_type", "p_x", "p_y"];
var reaction_recorder = new ReactionRecorder(nod_record_label);

var reset_spot_button = document.getElementById("reset_spots");
reset_spot_button.addEventListener("click", () => {
    var spot_buttons = document.getElementsByClassName("spot_cursor");
    while (spot_buttons.length > 0) {
        spot_buttons[0].remove();
    }
    gaze_speaker_data.status = STATUS.CLEARSPOT;
    ws.send(JSON.stringify(gaze_speaker_data));
});

var spot_cursor_width = 20;
var spot_cursor_height = 20;

function createSpotCursor(pos_x, pos_y) {
    var new_spot_cursor = document.createElement("a");
    new_spot_cursor.classList.add("spot_cursor");
    new_spot_cursor.style.width = spot_cursor_width + "px";
    new_spot_cursor.style.height = spot_cursor_height + "px";
    new_spot_cursor.addEventListener("click", (e) => {
        console.log("aaaaaaa");
        new_spot_cursor.remove();
    });
    if (is_speaker) {
        new_spot_cursor.style.left = pos_x - spot_cursor_width + "px";
        new_spot_cursor.style.top = pos_y - spot_cursor_height + "px";
        gaze_speaker_container.appendChild(new_spot_cursor);
    } else {
        var screen_width = screen.width;
        var screen_height = screen.height;
        var anchor_x = screen_width / 20;
        var anchor_y = screen_height / 2 - screen_width * 81 / 320;
        var coef_x = screen_width * 0.9 / 800;
        var coef_y = screen_width * 81 / (160 * 450);
        new_spot_cursor.style.left = anchor_x + coef_x * pos_x - spot_cursor_width + "px";
        new_spot_cursor.style.top = anchor_y + coef_y * pos_y - spot_cursor_height + "px";
        gaze_audience_images.appendChild(new_spot_cursor);
    }
}

function changeImage() {
    current_image_index += 1;
    if (current_image_index >= image_name_list.length) {
        current_image_index = 0;
    }
    audience_image.src = "image/" + image_name_list[current_image_index];
    base_image.src = "image/" + image_name_list[current_image_index];

}

function startGaze(client_type_val) {
    console.log("start gaze: ", client_type_val);
    if (client_type_val == NAME.AUDIENCE) {
        gaze_audience_container.style.visibility = "visible";
        startGazeAudience();
        // gaze_button_list.finishCalibration();
    } else {
        is_speaker = true;
        gaze_speaker_container.style.visibility = "visible";
        startSystemUtility();
        startGazeSpeaker();
    }
}

var screen_width = screen.width;
var screen_height = screen.height;

function startGazeAudience() {
    for (var i=0; i<gaze_button_num; i++) {
        var gaze_button_elm = document.getElementById("calibutton" + String(i+1));
        var gaze_button = new GazeButton(gaze_button_elm, max_press_count);
        gaze_button_list.addButton(gaze_button);
    }

    var gaze_audience_message_str = JSON.stringify(gaze_audience_data);
    checkConnection();
    ws.send(gaze_audience_message_str);
    gaze_audience_data.status = STATUS.DATA;
    ws.addEventListener("message", function(e) {
        var received_msg = JSON.parse(e.data);
        if (received_msg.name == NAME.SERVER) {
            gaze_audience_data.user_id = received_msg.your_id;
            gaze_audience_data.status = STATUS.DATA;
        } else if (received_msg.name == NAME.SPEAKER) {
            if (received_msg.status == STATUS.SPEAKERDATA) {
                if (gaze_button_list.is_calibration_finished) {
                    console.log(received_msg.c_x, received_msg.c_y);
                    createSpotCursor(received_msg.c_x, received_msg.c_y);
                }
            } else if (received_msg.status == STATUS.CLEARSPOT) {
                if (gaze_button_list.is_calibration_finished) {
                    var spot_buttons = document.getElementsByClassName("spot_cursor");
                    while (spot_buttons.length > 0) {
                        spot_buttons[0].remove();
                    }
                }
            }
        }
    });

    setInterval(sendGazeData, 300);

    webgazer.setGazeListener(function(data, elapsedTime) {
        if (data == null) {
            return;
        }
        gaze_audience_data.updateData([data.x/screen_width, data.y/screen_height]);
    }).begin();
    webgazer.params.showGazeDot = false;

    document.documentElement.requestFullscreen();

    document.addEventListener("keydown", event => {
        if (event.key == "n") {
            changeImage();
        }
    })
}

function sendGazeData() {
    ws.send(JSON.stringify(gaze_audience_data));
}

var base_image = document.getElementById("base_image");
var gaze_visualization_canvas = document.getElementById("gaze_visualization_canvas");

gaze_visualization_canvas.addEventListener("click", (e) => {
    console.log(e.offsetX, e.offsetY);
    gaze_speaker_data.updateCursorPos(e.offsetX, e.offsetY);
    ws.send(JSON.stringify(gaze_speaker_data));
    createSpotCursor(e.pageX, e.pageY);
});

var gaze_visualizer = new GazeVisualizer(gaze_visualization_canvas);

function startGazeSpeaker() {
    document.body.addEventListener("keydown", event => {
        if (event.key == "s") {
            reaction_recorder.saveRecord();
        } else if (event.key == "n") {
            changeImage();
        }
    })

    var gaze_speaker_msg_str = JSON.stringify(gaze_speaker_data);
    checkConnection();
    ws.send(gaze_speaker_msg_str);
    ws.addEventListener("message", function(e) {
        var received_msg = JSON.parse(e.data);
        // console.log(received_msg);
        if (received_msg.name == NAME.SERVER) {
            gaze_speaker_data.user_id = received_msg.your_id;
        } else if (received_msg.status == STATUS.DATA) {
            var audience_id = received_msg.user_id;
            var new_audience_data = Object.assign(new GazeAudienceData(), received_msg);
            reaction_recorder.updateRecordList(new_audience_data.getCurrentData());
            old_gaze_pos = gaze_visualizer.checkSequenceList(new_audience_data);
            // gaze_visualizer.visualizeCursors();
            gaze_visualizer.visualizeHeatmap(old_gaze_pos);
        }
    });
}