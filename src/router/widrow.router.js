import express from "express"; 
import { requestWithdrawal } from "../controller/widrow.conroller.js";
import { getPendingWithdrawals } from "../controller/widrow.conroller.js";
import { processWithdrawal , rejectWithdrawal } from "../controller/widrow.conroller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/adminRole.middleware.js";
import { getMyWithdrawalHistory } from "../controller/widrow.conroller.js";
const router = express.Router()  



router.post("/widrowrequest" , verifyToken , requestWithdrawal) 
router.get("/userwidrowhistory" , verifyToken , getMyWithdrawalHistory) 
router.get("/pendingwidrow" , verifyToken , adminOnly , getPendingWithdrawals)
router.put("/processwidrowal" , verifyToken , adminOnly ,processWithdrawal)
router.put("/rejectwidrowal" , verifyToken , adminOnly ,rejectWithdrawal)

export default router