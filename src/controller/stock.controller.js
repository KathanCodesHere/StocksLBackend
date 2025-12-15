import pool from "../config/database.config.js";
import cloudinary from "../config/cloudanary.config.js";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('image');

//

// 1. POST - Add New Stock with Image (FIXED VERSION)
export const addStock = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file'
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
        userId
      } = req.body;

      console.log("Received data:", req.body);

      // Detailed validation
      if (!stock_name || stock_name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "Stock name is required"
        });
      }

      if (!stock_buy_price || isNaN(stock_buy_price)) {
        return res.status(400).json({
          success: false,
          message: "Valid buy price is required"
        });
      }

      if (!quantity || isNaN(quantity)) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required"
        });
      }

      if (!purchase_date) {
        return res.status(400).json({
          success: false,
          message: "Purchase date is required"
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      let imageUrl = null;
      
      // Handle file upload
      if (req.file) {
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'stock_images',
                public_id: `stock_${Date.now()}`,
                resource_type: 'auto'
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
          console.error('Cloudinary upload error:', uploadError);
          // Image upload fail hua toh bhi continue karein
        }
      }

      // Convert values with proper null handling
      const parsedBuyPrice = parseFloat(stock_buy_price);
      const parsedCurrentPrice = current_price ? 
        parseFloat(current_price) : parsedBuyPrice;
      const parsedQuantity = parseInt(quantity);

      // Check for NaN after parsing
      if (isNaN(parsedBuyPrice) || isNaN(parsedQuantity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid numeric values"
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
        imageUrl
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
          imageUrl  // null if no image
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
          quantity: parsedQuantity
        }
      });

    } catch (error) {
      console.error("Add stock error:", error);
      console.error("Error details:", error.message);
      console.error("Request body:", req.body);
      
      res.status(500).json({ 
        success: false, 
        message: "Error adding stock",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}; 




export const updateStock = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      let stockIdStr = req.params.id;
      if (stockIdStr.startsWith(':')) {
        stockIdStr = stockIdStr.substring(1);
      }
      
      const stockId = parseInt(stockIdStr);
      const userId = parseInt(req.body.userId);
      
      console.log("Stock ID:", stockId, "User ID:", userId);
      
      if (isNaN(stockId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid Stock ID: ${req.params.id}`
        });
      }
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "Valid User ID required"
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
          message: "Stock not found"
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
          message: "No fields to update"
        });
      }
      
      // ❌ REMOVE THIS LINE if you don't have updated_at column
      // updates.push("updated_at = NOW()");
      
      values.push(stockId, userId);
      
      const query = `UPDATE stocks SET ${updates.join(', ')} WHERE stock_id = ? AND user_id = ?`;
      
      console.log("Query:", query);
      console.log("Values:", values);
      
      const [result] = await pool.execute(query, values);
      
      res.json({
        success: true,
        message: "Stock updated successfully",
        data: {
          stock_id: stockId,
          user_id: userId,
          affected_rows: result.affectedRows
        }
      });

    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Update failed",
        error: error.sqlMessage || error.message
      });
    }
  });
};





// ✅ DELETE STOCK - Admin deletes user's stock (User ID from body)
export const deleteStock = async (req, res) => {
  try {
    const adminId = req.user.id; // Admin ID from token
    const stockId = req.params.id; // Stock ID from URL
    
    // ✅ User ID from request body
    const { userId } = req.body;

    console.log(`Delete Request - Admin: ${adminId}, Stock: ${stockId}, User: ${userId}`);

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required in request body"
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
        message: `Stock ID ${stockId} not found for User ${userId}`
      });
    }

    const stock = existing[0];

    // 🟢 DELETE IMAGE FROM CLOUDINARY (if exists)
    if (stock.image_url) {
      try {
        const publicId = stock.image_url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`stock_images/${publicId}`);
        console.log("✅ Image deleted from Cloudinary");
      } catch (cloudinaryError) {
        console.log('⚠️ Image deletion failed:', cloudinaryError);
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
        message: "Failed to delete stock"
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
        deleted_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Delete stock error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting stock",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 




// ✅ GET USER'S STOCKS - User gets their own stocks (from req.user.id)
export const getUserStocks = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ User ID from token (logged in user)
    const { status = 'active', search = '' } = req.query;

    console.log(`Fetching stocks for User ID: ${userId}`);

    // Build query
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
        created_at,
        ROUND((current_price - stock_buy_price) * quantity, 2) as total_profit_loss,
        ROUND(((current_price - stock_buy_price) / stock_buy_price) * 100, 2) as profit_loss_percentage
      FROM stocks 
      WHERE user_id = ? 
    `;

    const params = [userId];

    // Add status filter
    if (status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    // Add search filter
    if (search) {
      query += ` AND stock_name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY purchase_date DESC`;

    const [stocks] = await pool.execute(query, params);

    // Calculate totals
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalProfitLoss = 0;
    
    stocks.forEach(stock => {
      const investment = stock.stock_buy_price * stock.quantity;
      const currentValue = stock.current_price * stock.quantity;
      
      totalInvestment += investment;
      totalCurrentValue += currentValue;
      totalProfitLoss += (currentValue - investment);
    });

    const totalProfitLossPercentage = totalInvestment > 0 ? 
      (totalProfitLoss / totalInvestment) * 100 : 0;

    res.json({
      success: true,
      user_id: userId,
      count: stocks.length,
      summary: {
        total_stocks: stocks.length,
        total_investment: totalInvestment.toFixed(2),
        total_current_value: totalCurrentValue.toFixed(2),
        total_profit_loss: totalProfitLoss.toFixed(2),
        total_profit_loss_percentage: totalProfitLossPercentage.toFixed(2)
      },
      stocks: stocks
    });

  } catch (error) {
    console.error("❌ Get user stocks error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching stocks" 
    });
  }
};