import express from "express"; 
import upload from "../config/multer.config.js";
import { adminOnly } from "../middleware/adminRole.middleware.js";
import { agenAdmintonly } from "../middleware/agentRole.middleware.js";

import { verifyToken } from "../middleware/auth.middleware.js";

import {  uploadPayment } from "../controller/paymentcontroller.js";

import { getPendingPayments } from "../controller/paymentcontroller.js";
import { verifyPayment , rejectPayment } from "../controller/paymentcontroller.js"; 
import { updateBalanceByAdmin } from "../controller/paymentcontroller.js";
import { getApprovedPayments } from "../controller/paymentcontroller.js";
import { getMyPaymentHistory } from "../controller/paymentcontroller.js";
const router  = express.Router() 


router.post("/paymentupload", verifyToken, upload.single('screenshot'), uploadPayment);

router.get("/pendingpaymentlist" , verifyToken ,adminOnly , getPendingPayments )
router.put("/verifypayment" , verifyToken ,adminOnly , verifyPayment )  
router.put("/rejectpayment" , verifyToken ,adminOnly , rejectPayment )  
router.put("/updatebalancebyadmin" , verifyToken ,adminOnly , updateBalanceByAdmin )  
router.get("/aprovedpaymnt" , verifyToken ,adminOnly , getApprovedPayments )  
router.get("/userpaymenthistory" , verifyToken , getMyPaymentHistory )  


export default router