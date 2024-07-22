import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`※※ MONGODB Connection established ※※ ${connectionInstance.connection.host} `)
    } catch (error) {
        console.log("MONGODB connection Failed at db/index.js : ", error)
        process.exit(1)
    }
}

export default connectDB