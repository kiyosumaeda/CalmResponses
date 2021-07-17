var media = navigator.mediaDevices.getUserMedia({
    video: {facingMode: "user"},
    audio: false
});
media.then((stream) => {
    video.srcObject = stream;
});

var tracker = new clm.tracker();
tracker.init(pModel);
tracker.start(video);

function drawLoop() {
    requestAnimationFrame(drawLoop);
    var positions = tracker.getCurrentPosition();
    showData(positions);
    context.clearRect(0, 0, canvas.width, canvas.height);
    tracker.draw(canvas);
}
drawLoop();

function showData(pos) {
    var str = "";
    //62 is a nose tip position
    str = "feature" + 62 + ": (" + Math.round(pos[62][0]) + ", " + Math.round(pos[62][1]) + ")";
    // for (var i=0; i<pos.length; i++) {
    //     str += "feature" + i + ": (" + Math.round(pos[i][0]) + ", " + Math.round(pos[i][1]) + ")<br>";
    // }
    // var dat = document.getElementById("dat");
    dat.innerHTML = str;
}