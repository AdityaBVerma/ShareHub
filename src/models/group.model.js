import mongoose , {Schema} from "mongoose";

const groupSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    videofiles:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video" 
        }
    ],
    docfiles:[
        {
            type: Schema.Types.ObjectId,
            ref: "Doc" 
        }
    ],
    imagefiles:[
        {
            type: Schema.Types.ObjectId,
            ref: "Image" 
        }
    ],
    ownedInstance: {
        type: Schema.Types.ObjectId,
        ref: "Instance"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

export const Group = mongoose.model("Group", groupSchema)