import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { 
    addComments, 
    deleteComments, 
    getInstanceComments, 
    updateComments 
} from "../controllers/comments.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/:instanceId")
    .get(getInstanceComments)
    .post(addComments);

router.route("/c/:commentId")
    .delete(deleteComments)
    .patch(updateComments);

export default router