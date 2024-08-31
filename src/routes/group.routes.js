import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createNewGroup, 
    deleteGroup, 
    getGroupById, 
    updateGroup,
    moveGroup,
    getGroupCollaborators
} from "../controllers/group.controller.js";

const router = Router();

router.use(verifyJWT)

router.route('/instances/:instanceId/groups')
    .post(createNewGroup);

router.route('/instances/:instanceId/groups/:groupId')
    .get(getGroupById)
    .patch(updateGroup)
    .delete(deleteGroup);

router.route('/groups/:groupId/move')
    .post(moveGroup)

router.route('/group/:groupId')
    .get(getGroupCollaborators)

export default router