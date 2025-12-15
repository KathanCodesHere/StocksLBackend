import express from "express";
import { createPaymentMethod, getAllPaymentMethods, updatePaymentMethod } from "../controller/admin.payemnt.qr.js";
import upload from "../config/multer.config.js";
const router = express.Router();

router.post("/create",upload.single('qr_image') , createPaymentMethod);
router.get("/all", getAllPaymentMethods);
router.put("/update/:id",upload.single('qr_image') , updatePaymentMethod);

export default router;