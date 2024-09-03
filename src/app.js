import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(cookieParser())
app.use(express.static("public"))

import userRouter from "./routes/user.routes.js"
import instanceRouter from "./routes/instance.routes.js"
import groupRouter from "./routes/group.routes.js"
import resourceRouter from "./routes/resource.routes.js"
import commentRouter from "./routes/comment.routes.js"


app.use("/api/v1/users", userRouter)
app.use("/api/v1/instances", instanceRouter)
app.use("/api/v1/groups", groupRouter)
app.use("/api/v1/resources", resourceRouter)
app.use("/api/v1/comments", commentRouter)

export {app}