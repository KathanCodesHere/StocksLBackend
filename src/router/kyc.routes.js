import express from "express";
import { createKYC  , getKYC} from "../controller/kyc.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import upload from "../config/multer.config.js";

const router = express.Router();

router.post("/post", 
  verifyToken,                       // 1. Token verify
  upload.fields([                    // 2. File upload
    { name: 'aadhaar_image', maxCount: 1 },
    { name: 'pancard_image', maxCount: 1 }
  ]),
  createKYC                         // 3. Controller
);
// GET KYC by user ID
router.get("/get", verifyToken, getKYC);

export default router;