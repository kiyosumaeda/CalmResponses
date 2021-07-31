class GazePosSequence {
    constructor(sn) {
        this.sequence_num = sn;
        this.pos_x_queue = [];
        this.pos_y_queue = [];
        for (var i=0; i<this.sequence_num; i++) {
            this.pos_x_queue.push(0.0);
            this.pos_y_queue.push(0.0);
        }
        this.pos_x_sum = 0.0;
        this.pos_y_sum = 0.0;
    }

    getCenterPos() {
        var c_p_x = this.pos_x_sum/this.sequence_num;
        var c_p_y = this.pos_y_sum/this.sequence_num;
        return [c_p_x, c_p_y];
    }

    updatePosSequence(gaze_audience_data) {
        var old_pos_x = this.pos_x_queue.shift();
        var old_pos_y = this.pos_y_queue.shift();
        this.pos_x_sum -= old_pos_x;
        this.pos_y_sum -= old_pos_y;
        
        var new_pos_x = gaze_audience_data.p_x;
        var new_pos_y = gaze_audience_data.p_y;
        this.pos_x_queue.push(new_pos_x);
        this.pos_y_queue.push(new_pos_y);
        this.pos_x_sum += new_pos_x;
        this.pos_y_sum += new_pos_y;
    }
}

class GazeVisualizer {
    constructor(canvas) {
        this.context = canvas.getContext("2d");
        this.image_data = this.context.getImageData(0, 0, canvas.width, canvas.height);
        this.image_width = this.image_data.width;
        this.image_height = this.image_data.height;
        console.log(this.image_width, this.image_height);
        this.image_array = this.image_data.data;

        this.gaze_pos_sequence_list = [];

        this.gaze_radius = 5;
        this.heatmap_values = new Array(450);
        for (var y=0; y<450; y++) {
            this.heatmap_values[y] = new Array(800).fill(0);
        }

        this.cursor_col = [255, 0, 0, 200];
    }

    checkSequenceList(gaze_audience_data) {
        var audience_id = gaze_audience_data.user_id;
        while (audience_id > this.gaze_pos_sequence_list.length) {
            this.addGazePosSequence(gaze_audience_data);
        }
        this.gaze_pos_sequence_list[audience_id-1].updatePosSequence(gaze_audience_data);
    }

    addGazePosSequence(gaze_audience_data) {
        var new_sequence = new GazePosSequence(20);
        this.gaze_pos_sequence_list.push(new_sequence);
    }

    visualizeCursors() {
        for (var y=0; y<450; y++) {
            for (var x=0; x<800; x++) {
                var pixel_pos = (y * this.image_width + x) * 4;
                this.image_array[pixel_pos+0] = 0;
                this.image_array[pixel_pos+1] = 0;
                this.image_array[pixel_pos+2] = 0;
                this.image_array[pixel_pos+3] = 0;
            }
        }
        // this.context.fillStyle = "rgba(255, 255, 255, 0)";
        // this.context.fillStyle = "rgba(0, 0, 0, 0.05)";
        // this.context.fillRect(0, 0, this.image_width, this.image_height);
        for (var i=0; i<this.gaze_pos_sequence_list.length; i++) {
            var center_pos = this.gaze_pos_sequence_list[i].getCenterPos();
            var c_p_x = Math.floor(center_pos[0]*this.image_width);
            var c_p_y = Math.floor(center_pos[1]*this.image_height);
            console.log(c_p_x, c_p_y);
            // this.context.beginPath();
            // this.context.arc(c_p_x, c_p_y, 4, 0, Math.PI*2, false);
            // this.context.fillStyle = "#FF404F";
            // this.context.fill();
            for (var y=c_p_y-this.gaze_radius; y<c_p_y+this.gaze_radius; y++) {
                for (var x=c_p_x-this.gaze_radius; x<c_p_x+this.gaze_radius; x++) {
                    var dist = (x-c_p_x)*(x-c_p_x) + (y-c_p_y)*(y-c_p_y);
                    if (dist < this.gaze_radius * this.gaze_radius) {
                        var pixel_pos = (y * this.image_width + x) * 4;
                        this.image_array[pixel_pos+0] = this.cursor_col[0];
                        this.image_array[pixel_pos+1] = this.cursor_col[1];
                        this.image_array[pixel_pos+2] = this.cursor_col[2];
                        this.image_array[pixel_pos+3] = this.cursor_col[3];
                    }
                }
            }
        }
        console.log("end visualization");
        this.context.putImageData(this.image_data, 0, 0);
    }

    updateSequence(new_pos_x, new_pos_y) {

    }
}