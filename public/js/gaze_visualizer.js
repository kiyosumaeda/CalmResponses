class GazePosSequence {
    constructor(sn) {
        this.sequence_num = sn;
        this.pos_x_queue = [];
        this.pos_y_queue = [];
        for (var i=0; i<this.sequence_num; i++) {
            this.pos_x_queue.push(2000.0);
            this.pos_y_queue.push(2000.0);
        }
        this.pos_x_sum = 0.0;
        this.pos_y_sum = 0.0;
        this.latest_pos_x = 0.0;
        this.latest_pos_y = 0.0;
    }

    getLatestPos() {
        return [this.latest_pos_x, this.latest_pos_y];
    }

    getCenterPos() {
        var c_p_x = this.pos_x_sum/this.sequence_num;
        var c_p_y = this.pos_y_sum/this.sequence_num;
        return [c_p_x, c_p_y];
    }

    updatePosSequence(gaze_audience_data) {
        var old_pos_x = this.pos_x_queue.shift();
        var old_pos_y = this.pos_y_queue.shift();
        var old_pos = [old_pos_x, old_pos_y];
        this.pos_x_sum -= old_pos_x;
        this.pos_y_sum -= old_pos_y;
        
        var new_pos_x = gaze_audience_data.p_x;
        var new_pos_y = gaze_audience_data.p_y;
        this.pos_x_queue.push(new_pos_x);
        this.pos_y_queue.push(new_pos_y);
        this.latest_pos_x = new_pos_x;
        this.latest_pos_y = new_pos_y;
        this.pos_x_sum += new_pos_x;
        this.pos_y_sum += new_pos_y;
        return old_pos;
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
        this.heatmap_radius = 80;
        this.heatmap_values = new Array(this.image_height);
        for (var y=0; y<this.image_height; y++) {
            this.heatmap_values[y] = new Array(this.image_width).fill(0);
        }

        this.cursor_col = [255, 0, 0, 200];
    }

    checkSequenceList(gaze_audience_data) {
        var audience_id = gaze_audience_data.user_id;
        while (audience_id > this.gaze_pos_sequence_list.length) {
            this.addGazePosSequence(gaze_audience_data);
        }
        var old_pos = this.gaze_pos_sequence_list[audience_id-1].updatePosSequence(gaze_audience_data);
        var old_pos_x = old_pos[0];
        var old_pos_y = old_pos[1];
        return [old_pos_x, old_pos_y, audience_id];
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

    visualizeHeatmap(old_gaze_pos) {
        var old_pos_x = old_gaze_pos[0];
        var old_pos_y = old_gaze_pos[1];
        var audience_id = old_gaze_pos[2];

        // var new_center_pos = this.gaze_pos_sequence_list[audience_id-1].getCenterPos();
        this.updateHeatmapValue([old_pos_x, old_pos_y], -1);
        this.updateHeatmapValue(this.gaze_pos_sequence_list[audience_id-1].getLatestPos(), 1);

        for (var y=0; y<this.image_height; y++) {
            for (var x=0; x<this.image_width; x++) {
                var heatmap_value = this.heatmap_values[y][x];
                var hsv = [0, 1, 1];
                hsv[0] = Math.max(0, 180 - heatmap_value);
                var rgb = this.hsvToRgb(hsv[0], 1, 1);
                if (heatmap_value > -1) {
                    var pixel_pos = (y * this.image_width + x) * 4;
                    this.image_array[pixel_pos+0] = rgb[0];
                    this.image_array[pixel_pos+1] = rgb[1];
                    this.image_array[pixel_pos+2] = rgb[2];
                    // var alpha = 0;
                    var alpha = Math.max(0, heatmap_value - 60);
                    // if (hsv[0] > 178) {
                    //     alpha = 60;
                    // } else {
                    //     alpha = (60 - 30) / (178 * 178) * hsv[0] * hsv[0] + 30;
                    // }
                    // if (hsv[0] > 180) {
                    //     alpha = 0;
                    // }
                    this.image_array[pixel_pos+3] = alpha;
                }
            }
        }
        this.context.putImageData(this.image_data, 0, 0);
    }

    updateHeatmapValue(center_pos, direction) {
        var c_p_x = Math.floor(center_pos[0]*this.image_width);
        var c_p_y = Math.floor(center_pos[1]*this.image_height);
        // c_p_x = 400;
        // c_p_y = 225;
        console.log(c_p_x, c_p_y);

        for (var y=c_p_y-this.heatmap_radius; y<c_p_y+this.heatmap_radius; y++) {
            for (var x=c_p_x-this.heatmap_radius; x<c_p_x+this.heatmap_radius; x++) {
                if (y>0 && y<this.image_height && x>0 && x<this.image_width) {
                    var dist = (x-c_p_x)*(x-c_p_x) + (y-c_p_y)*(y-c_p_y);
                    if (dist < this.heatmap_radius*this.heatmap_radius) {
                        this.heatmap_values[y][x] += direction * (this.heatmap_radius - Math.sqrt(dist));
                    }
                }
            }
        }
    }

    hsvToRgb(h,s,v) {

        var h = h / 60;
        if (s == 0) return [v * 255, v * 255, v * 255];
    
        var rgb;
        var i = parseInt(h);
        var f = h - i;
        var v1 = v * (1 - s);
        var v2 = v * (1 - s * f);
        var v3 = v * (1 - s * (1 - f));
    
        switch (i) {
            case 0:
            case 6:
                rgb = [v, v3, v1];
            break;
    
            case 1:
                rgb = [v2, v, v1];
            break;
    
            case 2:
                rgb = [v1, v, v3];
            break;
    
            case 3:
                rgb = [v1, v2, v];
            break;
    
            case 4:
                rgb = [v3, v1, v];
            break;
    
            case 5:
                rgb = [v, v1, v2];
            break;
        }

        rgb[0] = Math.floor(rgb[0] * 255);
        rgb[1] = Math.floor(rgb[1] * 255);
        rgb[2] = Math.floor(rgb[2] * 255);
    
        return rgb;
    }
}