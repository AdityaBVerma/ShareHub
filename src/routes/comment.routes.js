import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    addComments, 
    deleteComments, 
    getInstanceComments, 
    updateComments 
} from "../controllers/comments.controller.js";

const router = Router()

router.use(verifyJWT)

router.route('/:instanceId')
    .get(getInstanceComments)

router.route("/:instanceId")
    .post(addComments);

router.route("/:instanceId/:commentId")
    .delete(deleteComments)
    .patch(updateComments);

export default router