import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createNewGroup, deleteGroup, getAllGroups, getGroupById, updateGroup } from "../controllers/group.controller.js";

const router = Router();

router.use(verifyJWT)

router.route('/instances/:instanceId/groups')
    .get(getAllGroups)
    .post(createNewGroup);

router.route('/instances/:instanceId/groups/:groupId')
    .get(getGroupById)
    .patch(updateGroup)
    .delete(deleteGroup);

export default router