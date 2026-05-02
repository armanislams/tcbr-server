import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "user",
        enum: ['admin', 'user', "super-admin", "accountant", "island", "kl" ]
    }
},{timestamps:true})

const User = mongoose.model("User", userSchema)
export default User

