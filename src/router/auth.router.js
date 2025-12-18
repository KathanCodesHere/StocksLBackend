import express from "express";
import {
  forgotPassword,
  registerUser,
  resetPassword,
} from "../controller/auth.controller.js";
import { getPendingUsers } from "../controller/auth.controller.js";
import { universalLogin } from "../controller/auth.controller.js";
import { approvePendingUser } from "../controller/auth.controller.js";
import { adminOnly } from "../middleware/adminRole.middleware.js";
import { agenAdmintonly } from "../middleware/agentRole.middleware.js";
import { getUserProfile } from "../controller/auth.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { getApprovedUsers } from "../model/admin.model.js";

import { getApprovedUsersbyAdmin } from "../controller/auth.controller.js";
import { rejectPendingUser } from "../controller/auth.controller.js";
import {
  deleteUserByAdmin,
  postAdminpasswordReset,
} from "../controller/auth.controller.js";

const router = express.Router();

// registration user

//post
router.post("/resiteruser", registerUser);

// login

router.post("/login", universalLogin);

//get user profile

router.get("/profile", verifyToken, getUserProfile);

//admin related

router.get("/pending", verifyToken, agenAdmintonly, getPendingUsers);
router.put(
  "/aprovependiniguser",
  verifyToken,
  agenAdmintonly,
  approvePendingUser
);
router.get(
  "/aproveduserbyadmin",
  verifyToken,
  agenAdmintonly,
  getApprovedUsersbyAdmin
);
router.put(
  "/rejectuserbyadmin",
  verifyToken,
  agenAdmintonly,
  rejectPendingUser
);
router.delete(
  "/deleteuserbyadmin",
  verifyToken,
  agenAdmintonly,
  deleteUserByAdmin
);
router.post("/updateadminpass", postAdminpasswordReset);

//forgot password
router.post("/forgotPassword", forgotPassword);

//reset password
router.post("/resetPassword", resetPassword);
export default router;
