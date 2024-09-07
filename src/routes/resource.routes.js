import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadType } from "../middlewares/upload.middleware.js";
import { 
    deleteResource,
    getResourceById, 
    publishResource,
    updateResource,
    moveResource
} from "../controllers/resource.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/:instanceId/:groupId/:resourcetype")
    .post(uploadType, publishResource)

router.route("/:instanceId/:resourcetype/:resourceId")
    .get(getResourceById)
    .patch(updateResource)
    .delete(deleteResource)

router.route("/:instanceId/:resourcetype/:resourceId/move")
    .post(moveResource)

export default router