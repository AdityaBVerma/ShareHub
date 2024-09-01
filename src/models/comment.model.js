import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    instance: {
        type: Schema.Types.ObjectId,
        ref: "Instance"
    },
    commentOwner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)