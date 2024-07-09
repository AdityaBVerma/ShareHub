import mongoose, {Schema} from "mongoose";

const imageSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: "Group"
    },
    imagefile:{
        url:{
            type:String,
            required: true
        },
        public_id:{
            type:String,
            required: true
        }
    },
}, {timestamps: true})

export const Image = mongoose.model("Image",imageSchema)