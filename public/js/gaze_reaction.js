var gaze_speaker_container = document.getElementById("gaze_speaker_container");
var gaze_audience_container = document.getElementById("gaze_audience_container");

gaze_speaker_container.style.visibility = "hidden";
gaze_audience_container.style.visibility = "hidden";

var gaze_audience_data = new NodAudienceData();

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

function startGazeAudience() {
    var gaze_audience_message_str = JSON.stringify(gaze_audience_data);
    checkConnection();
    ws.send(gaze_audience_message_str);
    ws.addEventListener("message", function(e) {
        var received_msg = JSON.parse(e.data);
        if (received_msg.name == NAME.SERVER) {
            gaze_speaker_data.user_id = received_msg.your_id;
            gaze_speaker_data.status = STATUS.DATA;
        }
    });

    window.onload = async () => {
        webgazer.setGazeListener(function(data, elapsedTime) {
            if (data == null) {
                return;
            }

            console.log(data.x, data.y);
        }).begin();
    }
}

function startGazeSpeaker() {

}