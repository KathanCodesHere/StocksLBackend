import express from "express";
import { addEnquiry } from "../controller/enquiry.controller.js";

const router = express.Router();

router.post("/addenquiry", addEnquiry);

// router.get("/viewallEnquiry", verifyToken, agenAdmintonly, viewEnquiry);

export default router