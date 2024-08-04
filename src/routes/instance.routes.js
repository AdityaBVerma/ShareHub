import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createNewInstance, 
    deleteInstance, 
    getAllInstances, 
    getInstanceById, 
    toggleVisibilityStatus, 
    updateInstance 
} from "../controllers/instance.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/")
    .get(getAllInstances)
    .post(upload.single("thubmnail"), createNewInstance)

router.route("/:instanceId")
    .get(getInstanceById)
    .patch(upload.single("thubmnail"), updateInstance)
    .delete(deleteInstance)

router.route("/toggle/visibility/:instanceId").patch(toggleVisibilityStatus);

export default router