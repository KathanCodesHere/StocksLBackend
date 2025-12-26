import pool from "../config/database.config.js";
import cloudinary from "../config/cloudanary.config.js";
import multer from "multer";

import { sendError } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
}).single("image");

//

// 1. POST - Add New Stock with Image (FIXED VERSION)
export const addStock = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Error uploading file",
      });
    }

    try {
      // Destructure with default values
      const {
        stock_name,
        stock_symbol,
        stock_buy_price,
        current_price,
        quantity,
        purchase_date,
        userId,
      } = req.body;

      console.log("Received data:", req.body);

      // Detailed validation
      if (!stock_name || stock_name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Stock name is required",
        });
      }

      if (!stock_buy_price || isNaN(stock_buy_price)) {
        return res.status(400).json({
          success: false,
          message: "Valid buy price is required",
        });
      }

      if (!quantity || isNaN(quantity)) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }

      if (!purchase_date) {
        return res.status(400).json({
          success: false,
          message: "Purchase date is required",
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      let imageUrl = null;

      // Handle file upload
      if (req.file) {
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "stock_images",
                public_id: `stock_${Date.now()}`,
                resource_type: "auto",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );

            uploadStream.end(req.file.buffer);
          });

          imageUrl = uploadResult.secure_url;
          console.log("Image uploaded:", imageUrl);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          // Image upload fail hua toh bhi continue karein
        }
      }

      // Convert values with proper null handling
      const parsedBuyPrice = parseFloat(stock_buy_price);
      const parsedCurrentPrice = current_price
        ? parseFloat(current_price)
        : parsedBuyPrice;
      const parsedQuantity = parseInt(quantity);

      // Check for NaN after parsing
      if (isNaN(parsedBuyPrice) || isNaN(parsedQuantity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid numeric values",
        });
      }

      console.log("Inserting with values:", {
        userId,
        stock_name,
        stock_symbol: stock_symbol || null,
        buyPrice: parsedBuyPrice,
        currentPrice: parsedCurrentPrice,
        quantity: parsedQuantity,
        purchase_date,
        imageUrl,
      });

      // FIXED: Proper null handling for all parameters
      const [result] = await pool.execute(
        `INSERT INTO stocks 
         (user_id, stock_name,  stock_buy_price, 
          current_price, quantity, purchase_date, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          stock_name,

          parsedBuyPrice,
          parsedCurrentPrice,
          parsedQuantity,
          purchase_date,
          imageUrl, // null if no image
        ]
      );

      res.status(201).json({
        success: true,
        message: "Stock added successfully",
        stock_id: result.insertId,
        image_url: imageUrl,
        data: {
          stock_name,
          buy_price: parsedBuyPrice,
          quantity: parsedQuantity,
        },
      });
    } catch (error) {
      console.error("Add stock error:", error);
      console.error("Error details:", error.message);
      console.error("Request body:", req.body);

      res.status(500).json({
        success: false,
        message: "Error adding stock",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
};

export const updateStock = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      let stockIdStr = req.params.id;
      if (stockIdStr.startsWith(":")) {
        stockIdStr = stockIdStr.substring(1);
      }

      const stockId = parseInt(stockIdStr);
      const userId = parseInt(req.body.userId);

      console.log("Stock ID:", stockId, "User ID:", userId);

      if (isNaN(stockId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid Stock ID: ${req.params.id}`,
        });
      }

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "Valid User ID required",
        });
      }

      // Check stock exists
      const [existing] = await pool.execute(
        `SELECT * FROM stocks WHERE stock_id = ? AND user_id = ?`,
        [stockId, userId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Stock not found",
        });
      }

      // Prepare updates WITHOUT updated_at
      const updates = [];
      const values = [];

      const { stock_buy_price, current_price } = req.body;

      if (stock_buy_price && !isNaN(parseFloat(stock_buy_price))) {
        updates.push("stock_buy_price = ?");
        values.push(parseFloat(stock_buy_price));
      }

      if (current_price && !isNaN(parseFloat(current_price))) {
        updates.push("current_price = ?");
        values.push(parseFloat(current_price));
      }

      // Add other fields as needed...

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      // ❌ REMOVE THIS LINE if you don't have updated_at column
      // updates.push("updated_at = NOW()");

      values.push(stockId, userId);

      const query = `UPDATE stocks SET ${updates.join(
        ", "
      )} WHERE stock_id = ? AND user_id = ?`;

      console.log("Query:", query);
      console.log("Values:", values);

      const [result] = await pool.execute(query, values);

      res.json({
        success: true,
        message: "Stock updated successfully",
        data: {
          stock_id: stockId,
          user_id: userId,
          affected_rows: result.affectedRows,
        },
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({
        success: false,
        message: "Update failed",
        error: error.sqlMessage || error.message,
      });
    }
  });
};

//  DELETE STOCK - Admin deletes user's stock (User ID from body)
export const deleteStock = async (req, res) => {
  try {
    const adminId = req.user.id; // Admin ID from token
    const stockId = req.params.id; // Stock ID from URL

    // ✅ User ID from request body
    const { userId } = req.body;

    console.log(
      `Delete Request - Admin: ${adminId}, Stock: ${stockId}, User: ${userId}`
    );

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required in request body",
      });
    }

    // Check if stock exists for the given user
    const [existing] = await pool.execute(
      `SELECT stock_id, image_url, user_id FROM stocks 
       WHERE stock_id = ? AND user_id = ?`,
      [stockId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Stock ID ${stockId} not found for User ${userId}`,
      });
    }

    const stock = existing[0];

    // 🟢 DELETE IMAGE FROM CLOUDINARY (if exists)
    if (stock.image_url) {
      try {
        const publicId = stock.image_url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`stock_images/${publicId}`);
        console.log("✅ Image deleted from Cloudinary");
      } catch (cloudinaryError) {
        console.log("⚠️ Image deletion failed:", cloudinaryError);
        // Continue with stock deletion even if image deletion fails
      }
    }

    // 🔵 DELETE FROM DATABASE
    const [result] = await pool.execute(
      `DELETE FROM stocks 
       WHERE stock_id = ? AND user_id = ?`,
      [stockId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete stock",
      });
    }

    // 🟠 SUCCESS RESPONSE
    res.json({
      success: true,
      message: "Stock deleted successfully",
      data: {
        deleted_stock_id: stockId,
        user_id: userId,
        deleted_by_admin: adminId,
        deleted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Delete stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting stock",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// GET USER'S STOCKS - User gets their own stocks (from req.user.id)
// GET USER'S OWN STOCKS (Same logic as Admin API with charges breakdown)
export const getUserStocks = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { status = "active", search = "" } = req.query;

    console.log(`Fetching stocks for User ID: ${userId}`);

    // Build stock query
    let query = `
      SELECT 
        stock_id,
        stock_name,
        stock_buy_price,
        current_price,
        quantity,
        purchase_date,
        image_url,
        status,
        created_at
      FROM stocks
      WHERE user_id = ?
    `;

    const params = [userId];

    if (status !== "all") {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND stock_name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY purchase_date DESC`;

    const [stocks] = await pool.execute(query, params);

    // Get latest active user charges
    const [percentageRows] = await pool.execute(
      `SELECT brokerage_percent, gst_percent, stt_percent, transaction_tax_percent
       FROM user_percentage_settings
       WHERE user_id = ? AND is_active = 1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );

    const charges = percentageRows.length
      ? percentageRows[0]
      : {
          brokerage_percent: 5,
          gst_percent: 0,
          stt_percent: 0,
          transaction_tax_percent: 0,
        };

    // Totals
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let grossProfitLoss = 0;
    let finalCharges = 0;

    const enhancedStocks = stocks.map((stock) => {
      const buy = Number(stock.stock_buy_price);
      const cur = Number(stock.current_price);
      const qty = Number(stock.quantity);

      const investment = buy * qty;
      const currentValue = cur * qty;
      const profit = currentValue - investment;

      // Charges applied only on profit
      const brokerage =
        profit > 0 ? (profit * charges.brokerage_percent) / 100 : 0;
      const gst = brokerage * (charges.gst_percent / 100);
      const stt = profit > 0 ? (profit * charges.stt_percent) / 100 : 0;
      const txnTax =
        profit > 0 ? (profit * charges.transaction_tax_percent) / 100 : 0;

      const totalChargeForStock = brokerage + gst + stt + txnTax;

      totalInvestment += investment;
      totalCurrentValue += currentValue;
      grossProfitLoss += profit;
      finalCharges += totalChargeForStock;

      return {
        ...stock,

        investment: investment.toFixed(2),
        profit_loss: profit.toFixed(2),

        charges_breakdown: {
          brokerage: brokerage.toFixed(2),
          gst: gst.toFixed(2),
          stt: stt.toFixed(2),
          transaction_tax: txnTax.toFixed(2),
        },

        charges: totalChargeForStock.toFixed(2),
        net_profit_loss: (profit - totalChargeForStock).toFixed(2),
        profit_loss_percentage:
          investment > 0 ? ((profit / investment) * 100).toFixed(2) : "0.00",
      };
    });

    const netProfitLoss = grossProfitLoss - finalCharges;
    const netProfitLossPercentage =
      totalInvestment > 0 ? (netProfitLoss / totalInvestment) * 100 : 0;

    res.json({
      success: true,
      user_id: userId,
      count: enhancedStocks.length,
      summary: {
        total_stocks: enhancedStocks.length,
        total_investment: totalInvestment.toFixed(2),
        total_current_value: totalCurrentValue.toFixed(2),
        gross_profit_loss: grossProfitLoss.toFixed(2),
        total_charges: finalCharges.toFixed(2),
        net_profit_loss: netProfitLoss.toFixed(2),
        net_profit_loss_percentage: netProfitLossPercentage.toFixed(2),

        brokerage_percent: charges.brokerage_percent,
        gst_percent: charges.gst_percent,
        stt_percent: charges.stt_percent,
        transaction_tax_percent: charges.transaction_tax_percent,
      },
      stocks: enhancedStocks,
    });
  } catch (error) {
    console.error("Get user stocks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stocks",
    });
  }
};


//  ADMIN - Get All Stocks of Any User
export const getUserStocksByAdmin = async (req, res) => {
  try {
    const adminId = req.user.id; // Admin from token
    const userId = Number(req.params.userId);
    const { status = "all", search = "" } = req.query;

    console.log(`Admin ${adminId} fetching stocks of User ${userId}`);

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    //Check user exists
    const [userExists] = await pool.execute(
      `SELECT id FROM users WHERE id = ?`,
      [userId]
    );

    if (!userExists.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //Build stock query
    let query = `
      SELECT 
        stock_id,
        stock_name,
        stock_buy_price,
        current_price,
        quantity,
        purchase_date,
        image_url,
        status,
        created_at
      FROM stocks
      WHERE user_id = ?
    `;

    const params = [userId];

    if (status !== "all") {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND stock_name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY purchase_date DESC`;

    const [stocks] = await pool.execute(query, params);

    //  Get brokerage / tax percentage
    const [percentageRows] = await pool.execute(
      `SELECT brokerage_percent, gst_percent, stt_percent, transaction_tax_percent
   FROM user_percentage_settings
   WHERE user_id = ? AND is_active = 1
   ORDER BY updated_at DESC
   LIMIT 1`,
      [userId]
    );

    const charges = percentageRows.length
      ? percentageRows[0]
      : {
          brokerage_percent: 5,
          gst_percent: 0,
          stt_percent: 0,
          transaction_tax_percent: 0,
        };

    // Calculations
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let grossProfitLoss = 0;
    let finalCharges = 0; // <-- define here

    const enhancedStocks = stocks.map((stock) => {
      const buy = Number(stock.stock_buy_price);
      const cur = Number(stock.current_price);
      const qty = Number(stock.quantity);

      const investment = buy * qty;
      const currentValue = cur * qty;
      const profit = currentValue - investment;

      const brokerage =
        profit > 0 ? (profit * charges.brokerage_percent) / 100 : 0;
      const gst = brokerage * (charges.gst_percent / 100);
      const stt = profit > 0 ? (profit * charges.stt_percent) / 100 : 0;
      const txnTax =
        profit > 0 ? (profit * charges.transaction_tax_percent) / 100 : 0;

      const totalChargeForStock = brokerage + gst + stt + txnTax;

      totalInvestment += investment;
      totalCurrentValue += currentValue;
      grossProfitLoss += profit;
      finalCharges += totalChargeForStock;

      return {
        ...stock,

        investment: investment.toFixed(2),
        profit_loss: profit.toFixed(2),

        // NEW BREAKDOWN BLOCK
        charges_breakdown: {
          brokerage: brokerage.toFixed(2),
          gst: gst.toFixed(2),
          stt: stt.toFixed(2),
          transaction_tax: txnTax.toFixed(2),
        },

        charges: totalChargeForStock.toFixed(2),
        net_profit_loss: (profit - totalChargeForStock).toFixed(2),
      };
    });

    const netProfitLoss = grossProfitLoss - finalCharges;
    const netProfitLossPercentage =
      totalInvestment > 0 ? (netProfitLoss / totalInvestment) * 100 : 0;

    // Final response
    res.json({
      success: true,
      accessed_by_admin: adminId,
      user_id: userId,
      count: enhancedStocks.length,
      summary: {
        total_stocks: enhancedStocks.length,
        total_investment: totalInvestment.toFixed(2),
        total_current_value: totalCurrentValue.toFixed(2),
        gross_profit_loss: grossProfitLoss.toFixed(2),
        total_charges: finalCharges.toFixed(2), // <-- corrected
        net_profit_loss: netProfitLoss.toFixed(2),
        net_profit_loss_percentage: netProfitLossPercentage.toFixed(2),

        brokerage_percent: charges.brokerage_percent,
        gst_percent: charges.gst_percent,
        stt_percent: charges.stt_percent,
        transaction_tax_percent: charges.transaction_tax_percent,
      },
      stocks: enhancedStocks,
    });
  } catch (error) {
    console.error(" Admin get user stocks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user stocks",
    });
  }
};

//admin set percentage

export const setUserPercentage = async (req, res) => {
  try {
    const {
      user_id,
      brokerage_percent,
      gst_percent,
      stt_percent,
      transaction_tax_percent,
    } = req.body;

    if (!user_id) return sendError(res, 400, "User ID is required");

    const values = [
      brokerage_percent,
      gst_percent,
      stt_percent,
      transaction_tax_percent,
    ];

    if (values.some((v) => v === undefined || isNaN(v) || v < 0)) {
      return sendError(res, 400, "Invalid percentage values");
    }

    // Check user exists
    const [users] = await pool.execute(`SELECT id FROM users WHERE id = ?`, [
      user_id,
    ]);

    if (users.length === 0) return sendError(res, 404, "User not found");

    // UPSERT
    await pool.execute(
      `
      INSERT INTO user_percentage_settings
      (user_id, brokerage_percent, gst_percent, stt_percent, transaction_tax_percent)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        brokerage_percent = VALUES(brokerage_percent),
        gst_percent = VALUES(gst_percent),
        stt_percent = VALUES(stt_percent),
        transaction_tax_percent = VALUES(transaction_tax_percent),
        is_active = 1
      `,
      [
        user_id,
        brokerage_percent,
        gst_percent,
        stt_percent,
        transaction_tax_percent,
      ]
    );

    sendSuccess(
      res,
      {
        user_id,
        brokerage_percent,
        gst_percent,
        stt_percent,
        transaction_tax_percent,
      },
      "User percentage settings updated"
    );
  } catch (err) {
    console.error(err);
    sendError(res, 500, "Failed to update settings");
  }
};

//get user percentage

export const getUserPercentageByAdmin = async (req, res) => {
  try {
    const userId = req.params.userId; // <-- IMPORTANT

    // Get stocks
    const [stocks] = await pool.execute(
      `SELECT current_price, quantity FROM stocks WHERE user_id = ?`,
      [userId]
    );

    let subtotal = 0;
    stocks.forEach((s) => {
      subtotal += s.current_price * s.quantity;
    });

    // Fetch user percentage settings
    const [settings] = await pool.execute(
      `SELECT * FROM user_percentage_settings
   WHERE user_id = ? AND is_active = 1
   ORDER BY updated_at DESC
   LIMIT 1`,
      [userId]
    );

    if (!settings.length) {
      return sendSuccess(
        res,
        { subtotal, charges: {}, net_value: subtotal },
        "No percentage set — charges 0"
      );
    }

    const p = settings[0];

    const brokerage = subtotal * (p.brokerage_percent / 100);
    const gst = brokerage * (p.gst_percent / 100);
    const stt = subtotal * (p.stt_percent / 100);
    const txn_tax = subtotal * (p.transaction_tax_percent / 100);

    const net_value = subtotal - (brokerage + gst + stt + txn_tax);

    sendSuccess(res, {
      subtotal,
      brokerage,
      gst,
      stt,
      txn_tax,
      net_value,
    });
  } catch (err) {
    console.error(err);
    sendError(res, 500, "Failed to load trade summary");
  }
};
