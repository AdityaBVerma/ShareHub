import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
})

connectDB()
.then(() => {
    app.on("error",(req, res) => {
        console.log("Error : ", error)
        throw error
    })
    app.get("/test", (req, res) => {
        res.send("Hello dev")
    })
    app.listen(process.env.PORT || 3000, (req, res) => {
        console.log(`※※ App is listening on port ※※ ${process.env.PORT} `)
    })
})
.catch((error) => {
    console.log("MongoDB connection error at ./src/index.js")
})