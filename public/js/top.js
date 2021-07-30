//menu screen component
var start_system_button = document.getElementById("start_system");

var top_container = document.getElementById("top_container");

var is_system_condition = true;

var message_json = {
    label: "sender",
    x: 0,
    y: 0,
    id: 0
};

//menu screen
start_system_button.addEventListener("click", startSystem);

function startSystem() {
    var client_type_radios = document.getElementsByName("client_type");
    var reaction_type_radios = document.getElementsByName("reaction_type");

    for (var c_i=0; c_i<client_type_radios.length; c_i++) {
        if (client_type_radios[c_i].checked) {
            break;
        }
    }

    for (var r_i=0; r_i<reaction_type_radios.length; r_i++) {
        if (reaction_type_radios[r_i].checked) {
            break;
        }
    }

    var client_type_val = client_type_radios[c_i].value;
    var reaction_type_val = reaction_type_radios[r_i].value;

    if (reaction_type_val == "nodding") {
        top_container.style.visibility = "hidden";
        startNod(client_type_val);
    } else {
        top_container.style.visibility = "hidden";
        startGaze(client_type_val);
    }
}
