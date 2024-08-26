import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"


const instanceSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    thumbnail: {
        url:{
            type:String,
            required: true
        },
        public_id:{
            type:String,
            required: true
        }
    },
    password: {
        type: String,
    },
    description: {
        type: String
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    groups: [
        {
            type: Schema.Types.ObjectId,
            ref: "Group"
        }
    ],
    comments:[
        {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    isPrivate: {
        type: String,
        enum: ['public', 'private'],
        required: true,
    }
}, {timestamps: true});

instanceSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

instanceSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

export const Instance = mongoose.model("Instance", instanceSchema)