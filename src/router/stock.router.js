import express from "express";
import {
  addStock, // POST
  // GET single
  updateStock, // PUT
  // DELETE
  deleteStock,
  getUserStocks,
  getUserStocksByAdmin,
  setUserPercentage,
  getUserPercentageByAdmin,
} from "../controller/stock.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/adminRole.middleware.js";
import { agenAdmintonly } from "../middleware/agentRole.middleware.js";

const router = express.Router();

// CRUD Routes with file upload support

router.post("/addstock", verifyToken, agenAdmintonly, addStock);

// Update route with file upload support
router.put("/update/:id", updateStock);

router.delete("/delete/:id", verifyToken, deleteStock);

router.get("/getstock", verifyToken, getUserStocks);

// admin can view all stocks too of a user by user id
router.get(
  "/admin/userstocks/:userId",
  verifyToken,
  adminOnly,
  getUserStocksByAdmin
);

// set percentage for user stock
router.post("/admin/setpercentage", verifyToken, adminOnly, setUserPercentage);

// get percentage for user stock by admin
router.get(
  "/admin/getpercentage/:userId",
  verifyToken,
  adminOnly,
  getUserPercentageByAdmin
);
export default router;
