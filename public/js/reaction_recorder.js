class ReactionRecorder {
    constructor(label) {
        this.record_list = [];
        this.record_list.push(label);
    }

    getCurrentDate() {
        var current_time = new Date();
        var year = current_time.getFullYear();
        var month = current_time.getMonth();
        var day = current_time.getDate();
        var hour = current_time.getHours();
        var minute = current_time.getMinutes();
        var second = current_time.getSeconds();
        var millisecond = current_time.getMilliseconds();
        return year+":"+month+":"+day+":"+hour+":"+minute+":"+second+":"+millisecond;
    }

    updateRecordList(new_data_list) {
        var current_time = this.getCurrentDate();
        new_data_list.unshift(current_time);
        this.record_list.push(new_data_list);
    }

    jointRow() {
        var record_string = "\uFEFF";
        for (var i=0; i<this.record_list.length; i++) {
            var row = this.record_list[i];
            for (var j=0; j<row.length; j++) {
                record_string += String(row[j]);
                if (j != row.length-1) {
                    record_string += ",";
                }
            }
        record_string += "\n";
        }
        return record_string;
    }

    saveRecord() {
        var record_string = this.jointRow();
        var filename = "reaction_result.csv";
        var bom = new Uint8Array([0xef, 0xbb, 0xbf]);
        var blob = new Blob([bom, record_string], {type: "text/csv"});
        var url = (window.URL || window.webkitURL).createObjectURL(blob);
        var download = document.createElement("a");
        download.href = url;
        download.download = filename;
        download.click();
        (window.URL || window.webkitURL).revokeObjectURL(url);
    }
}
