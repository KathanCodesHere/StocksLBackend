import express from "express";
import { addEnquiry, viewEnquiry } from "../controller/enquiry.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { agenAdmintonly } from "../middleware/agentRole.middleware.js";

const router = express.Router();

router.post("/addenquiry", addEnquiry);

router.get("/viewallEnquiry", verifyToken, agenAdmintonly, viewEnquiry);

export default router