import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema({
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
    videofile:{
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

export const Video = mongoose.model("Video",videoSchema)