import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        public_id:{
            type: String
        },
        url: {
            type: String
        }
    },
    coverImage: {
        public_id:{
            type: String
        }, 
        url: {
            type: String
        }
    },
    password: {
        type: String,
        required: [true , "Password is required "]
    },
    refreshToken:{
        type: String
    },
    instances: [
        {
            type: Schema.Types.ObjectId,
            ref: "Instance"
        }
    ]
}, {timestamps: true})

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    const payload = {
        _id : this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    }
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function(){
    const payload = {
        _id: this._id
    }

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User", userSchema)