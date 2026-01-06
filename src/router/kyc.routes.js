import express from "express";
import {
  createKYC,
  getKYC,
  getKYCByUser,
  getKYCByAdmin
} from "../controller/kyc.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import upload from "../config/multer.config.js";

import { adminOnly } from "../middleware/adminRole.middleware.js";
const router = express.Router();

router.post(
  "/post",
  verifyToken, // 1. Token verify
  upload.fields([
    // 2. File upload
    { name: "aadhaar_image", maxCount: 1 },
    { name: "pancard_image", maxCount: 1 },
  ]),
  createKYC // 3. Controller
);
// GET KYC by user ID
router.get("/get", verifyToken, getKYC);

//get kyc for logged in user
router.get("/getKYCByUser", verifyToken, getKYCByUser);

// GET - Get KYC details for particular user by admin
router.get("/getKYCByAdmin/:userId", verifyToken, adminOnly, getKYCByAdmin);

export default router;
