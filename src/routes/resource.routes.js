import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadType } from "../middlewares/upload.middleware.js";
import { 
    deleteResource,
    getAllResourcesOfGroup,
    getResourceById, 
    publishResource,
    updateResource,
} from "../controllers/resource.controller.js";

const router = Router();

router.route("/:groupId").get(getAllResourcesOfGroup)

router.route("/:groupId/:instanceId/:resourcetype").post(verifyJWT, uploadType, publishResource)

router.route("/:instanceId/:resourcetype/:resourceId")
    .get(getResourceById)
    .patch(updateResource)
    .delete(deleteResource)

export default router