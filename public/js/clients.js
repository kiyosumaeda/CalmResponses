var NAME = {
    SERVER: "server",
    BASECLIENT: "base_client",
    AUDIENCE: "audience",
    SPEAKER: "speaker"
}

var REACTIONS = {
    NOD: "nod",
    GAZE: "gaze"
}

var STATUS = {
    START: "start",
    DATA: "data",
    SPEAKERDATA: "speaker_data",
    END: "end"
}

class ClientBaseData {
    constructor() {
        this.name = NAME.BASECLIENT;
        this.status = STATUS.START;
        this.user_id = 0;
    }

    setStatus(new_label) {
        this.status = new_label;
    }
}

class AudienceData extends ClientBaseData {
    constructor() {
        super();
        this.name = NAME.AUDIENCE;
    }

    updateData(new_data) {

    }
}

class SpeakerData extends ClientBaseData {
    constructor() {
        super();
        this.name = NAME.SPEAKER;
    }
}

class NodAudienceData extends AudienceData {
    constructor() {
        super();
        this.reaction_type = REACTIONS.NOD;
        this.v_x = 0;
        this.v_y = 0;
    }

    updateData(new_data) {
        var new_v_x = new_data[0];
        var new_v_y = new_data[1];
        this.v_x = new_v_x;
        this.v_y = new_v_y;
    }

    getCurrentData() {
        return [this.user_id, this.reaction_type, this.v_x, this.v_y];
    }
}

class GazeAudienceData extends AudienceData {
    constructor() {
        super();
        this.reaction_type = REACTIONS.GAZE;
        this.p_x = 0;
        this.p_y = 0;
    }

    updateData(new_data) {
        var new_p_x = new_data[0];
        var new_p_y = new_data[1];
        this.p_x = new_p_x;
        this.p_y = new_p_y;
    }

    getCurrentData() {
        return [this.user_id, this.reaction_type, this.p_x, this.p_y];
    }
}

class NodSpeakerData extends SpeakerData {
    constructor() {
        super();
        this.reaction_type = REACTIONS.NOD;
    }

    updateData(nod_audience) {

    }
}

class GazeSpeakerData extends SpeakerData {
    constructor() {
        super();
        this.reaction_type = REACTIONS.GAZE;
        this.c_x = 0;
        this.c_y = 0;
    }

    updateCursorPos(new_c_x, new_c_y) {
        this.status = STATUS.SPEAKERDATA;
        this.c_x = new_c_x;
        this.c_y = new_c_y;
    }

    updateData(gaze_audience) {
        
    }
}
