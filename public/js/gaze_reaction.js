var gaze_speaker_container = document.getElementById("gaze_speaker_container");
var gaze_audience_container = document.getElementById("gaze_audience_container");

gaze_speaker_container.style.visibility = "hidden";
gaze_audience_container.style.visibility = "hidden";

var gaze_audience_data = new GazeAudienceData();

var gaze_speaker_data = new GazeSpeakerData();
var gaze_record_label = ["timestamp", "user_id", "reaction_type", "p_x", "p_y"];
var reaction_recorder = new ReactionRecorder(nod_record_label);

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
    var gaze_audience_message_str = JSON.stringify(gaze_audience_data);
    checkConnection();
    ws.send(gaze_audience_message_str);
    gaze_audience_data.status = STATUS.DATA;
    ws.addEventListener("message", function(e) {
        var received_msg = JSON.parse(e.data);
        if (received_msg.name == NAME.SERVER) {
            gaze_audience_data.user_id = received_msg.your_id;
            gaze_audience_data.status = STATUS.DATA;
        }
    });

    webgazer.setGazeListener(function(data, elapsedTime) {
        if (data == null) {
            return;
        }
        gaze_audience_data.updateData([data.x/screen_width, data.y/screen_height]);
        ws.send(JSON.stringify(gaze_audience_data));
    }).begin();
}

var base_image = document.getElementById("base_image");
var gaze_visualization_canvas = document.getElementById("gaze_visualization_canvas");

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
        if (received_msg.name == NAME.SERVER) {
            gaze_speaker_data.user_id = received_msg.your_id;
        } else if (received_msg.status == STATUS.DATA) {
            var audience_id = received_msg.user_id;
            var new_audience_data = Object.assign(new GazeAudienceData(), received_msg);
            gaze_visualizer.checkSequenceList(new_audience_data);
            gaze_visualizer.visualizeCursors();
        }
    });
}