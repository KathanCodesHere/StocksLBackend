import express from "express"; 
import upload from "../config/multer.config.js";
import { requestWithdrawal } from "../controller/widrow.conroller.js";
import { getPendingWithdrawals } from "../controller/widrow.conroller.js";
import { processWithdrawal , rejectWithdrawal } from "../controller/widrow.conroller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/adminRole.middleware.js";
import { getMyWithdrawalHistory } from "../controller/widrow.conroller.js";
const router = express.Router()  



router.post("/widrowrequest" , verifyToken ,upload.single('screenshot'), requestWithdrawal) 
router.get("/userwidrowhistory" , verifyToken , getMyWithdrawalHistory) 
router.get("/pendingwidrow" , verifyToken , adminOnly , getPendingWithdrawals)
router.put("/processwidrowal" , verifyToken , adminOnly ,processWithdrawal)
router.put("/rejectwidrowal" , verifyToken , adminOnly ,rejectWithdrawal)

export default router