import mongoose, {Schema} from "mongoose";

const docSchema = new Schema({
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
    docfile:{
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

export const Doc = mongoose.model("Doc",docSchema)