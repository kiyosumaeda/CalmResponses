class GazeButton {
    constructor(gaze_button_elm, max_press) {
        this.button_element = gaze_button_elm;
        this.press_count = 0;
        this.max_press_count = max_press;
        this.is_finished = false;
        this.finished_col = "#404040";
    }

    pressButton() {
        this.press_count += 1;
        if (this.press_count >= this.max_press_count) {
            this.button_element.style.background = this.finished_col;
            this.is_finished = true;
        }
        console.log("count: ", this.press_count);
    }

    hideButton() {
        this.button_element.style.visibility = "hidden";
    }
}

class GazeButtonList {
    constructor(image_container) {
        this.gaze_button_list = [];
        this.audience_image_container = image_container;
        this.is_calibration_finished = false;
    }

    addButton(gaze_button) {
        gaze_button.button_element.addEventListener("click", () => {
            gaze_button.pressButton();
            var finished_button_count = 0;
            for (var i=0; i<this.gaze_button_list.length; i++) {
                if (this.gaze_button_list[i].is_finished) {
                    finished_button_count += 1;
                }
            }
            if (finished_button_count >= this.gaze_button_list.length) {
                console.log("finished");
                for (var i=0; i<this.gaze_button_list.length; i++) {
                    this.gaze_button_list[i].hideButton();
                }
                this.audience_image_container.style.visibility = "visible";
                this.is_calibration_finished = true;
            }
        });
        this.gaze_button_list.push(gaze_button);
    }
}