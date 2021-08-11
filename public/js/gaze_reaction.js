var gaze_speaker_container = document.getElementById("gaze_speaker_container");
var gaze_audience_container = document.getElementById("gaze_audience_container");

gaze_speaker_container.style.visibility = "hidden";
gaze_audience_container.style.visibility = "hidden";

var gaze_audience_images = document.getElementById("gaze_audience_images");
gaze_audience_images.style.visibility = "hidden";

var gaze_button_num = 9;
var gaze_calibration_buttons;
var gaze_button_list = new GazeButtonList(gaze_audience_images);
var max_press_count = 4;

var gaze_audience_data = new GazeAudienceData();

var gaze_speaker_data = new GazeSpeakerData();
var gaze_record_label = ["timestamp", "user_id", "reaction_type", "p_x", "p_y"];
var reaction_recorder = new ReactionRecorder(nod_record_label);

var spot_cursor_width = 20;
var spot_cursor_height = 20;

function createSpotCursor(pos_x, pos_y) {
    var new_spot_cursor = document.createElement("a");
    new_spot_cursor.id = "spot_cursor";
    new_spot_cursor.style.width = spot_cursor_width + "px";
    new_spot_cursor.style.height = spot_cursor_height + "px";
    new_spot_cursor.style.left = pos_x - spot_cursor_width + "px";
    new_spot_cursor.style.top = pos_y - spot_cursor_height + "px";
    new_spot_cursor.addEventListener("click", (e) => {
        console.log("aaaaaaa");
        new_spot_cursor.remove();
    });
    gaze_speaker_container.appendChild(new_spot_cursor);
}

function startGaze(client_type_val) {
    console.log("start gaze: ", client_type_val);
    if (client_type_val == NAME.AUDIENCE) {
        gaze_audience_container.style.visibility = "visible";
        startGazeAudience();
    } else {
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