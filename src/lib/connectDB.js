import mongoose from "mongoose";
import "dotenv/config"
export const connectDB= async()=>{
    const db = process.env.MONGODB_URI
    if(!db){
        console.error("Please provide MONGO_URI")
        process.exit(1)
    }
    try {
        await mongoose.connect(db)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("DB Error",error)
        process.exit(1)
    }
}