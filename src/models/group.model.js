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
            ref: "Video" 
        }
    ],
    imagefiles:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video" 
        }
    ]
}, {timestamps: true})

export const Group = mongoose.model("Group", groupSchema)