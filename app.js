const express = require("express");
const app = express();
const ws = require("ws");
const { Server } = require("ws");

const port = process.env.PORT || 8779;

app.use(express.static(__dirname + "/public"));

const server = app.use((req, res) => res.sendFile(__dirname + "/index.html"))
        .listen(port, () => console.log("listening... http://127.0.0.1:8779"));
