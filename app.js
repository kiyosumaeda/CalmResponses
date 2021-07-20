const express = require("express");
const app = express();
const ws = require("ws");
const { Server } = require("ws");

const port = process.env.PORT || 8779;

app.use(express.static(__dirname + "/public"));

const server = app.use((req, res) => res.sendFile(__dirname + "/index.html"))
        .listen(port, () => console.log("listening... http://127.0.0.1:8779"));

const wss = new Server({ server });

var senderClients = [];
var receiverClients = [];

var to_client_json = {
    publisher: "server",
    label: "id_issue",
    your_id: 0
};

var disconnected_notification = {
    label: "disconnected_user",
    id: 0
};

var regular_json = {
    label: "regular"
};

wss.on("connection", (ws) => {
    console.log("client connected");

    setInterval(function() {
        senderClients.forEach(sender => {
            sender.send(JSON.stringify(regular_json));
        });
        receiverClients.forEach(receiver => {
            receiver.send(JSON.stringify(regular_json));
        });
    }, 1000);

    ws.on("close", () => {
        var disconnected_user = senderClients.indexOf(ws);
        if (disconnected_user >= 0) {
            disconnected_notification.id = disconnected_user;
            receiverClients.forEach(receiver => {
                receiver.send(JSON.stringify(disconnected_notification));
            });
        }
        console.log("client disconnected");
    });

    ws.on("message", message => {
        var message_json = JSON.parse(message);
        // console.log(message_json);
        if (message_json.publisher == "nod_audience") {
            senderClients.push(ws);
            to_client_json.your_id = senderClients.length;
            ws.send(JSON.stringify(to_client_json));
        }

        if (message_json.publisher == "nod_speaker") {
            receiverClients.push(ws);
            to_client_json.your_id = receiverClients.length;
            ws.send(JSON.stringify(to_client_json));
        }

        if (message_json.label == "data") {
            receiverClients.forEach(receiver => {
                receiver.send(message);
            });
        }

        if (message_json.label == "admin") {
            receiverClients.forEach(receiver => {
                receiver.send(message);
            });
        }

        if (message_json.label == "admin_timer") {
            receiverClients.forEach(receiver => {
                receiver.send(message);
            });
        }
    });
});