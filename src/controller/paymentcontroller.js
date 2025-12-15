
import { sendError } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
import pool from "../config/database.config.js";
import { paymentVerifiedTemplate , paymentRejectedTemplate } from "../utils/emailTemplate.js";
import cloudinary from "../config/cloudanary.config.js";





// Upload Payment to Cloudinary
export const uploadPayment = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return sendError(res, 400, 'Please upload payment screenshot');
    }

    // Get data from request
    const { amount, transaction_id, payment_method = 'upi' } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    // Validation
    if (!amount) {
      return sendError(res, 400, 'Amount is required');
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return sendError(res, 400, 'Amount must be a positive number');
    }

    // Upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'payments',
            public_id: `payment_${userId}_${Date.now()}`,
            resource_type: 'image',
            transformation: [
              { width: 1000, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error('Failed to upload image to cloud'));
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });
    } catch (uploadError) {
      return sendError(res, 500, 'Failed to upload image. Please try again.');
    }

    // Insert into database
    const [result] = await pool.execute(
      `INSERT INTO payment_screenshots 
       (user_id, screenshot_url, original_filename, file_size, mime_type, 
        amount, transaction_id, payment_method, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        userId,
        uploadResult.secure_url,        // Cloudinary URL
        req.file.originalname,          // Original filename
        req.file.size,                  // File size in bytes
        req.file.mimetype,              // MIME type
        parseFloat(amount),             // Convert to number
        transaction_id || null,         // Transaction ID (optional)
        payment_method                  // Payment method
      ]
    );

    // Success response
    return sendSuccess(res, {
      paymentId: result.insertId,
      screenshotUrl: uploadResult.secure_url,
      amount: amount,
      transactionId: transaction_id,
      status: 'pending',
      uploadedAt: new Date()
    }, 'Payment uploaded successfully');

  } catch (error) {
    console.error('Payment upload error:', error);

    // Handle specific errors
    if (error.message === 'Only image files are allowed') {
      return sendError(res, 400, error.message);
    }

    if (error.code === 'ER_DATA_TOO_LONG') {
      return sendError(res, 400, 'Data too long for database column');
    }

    return sendError(res, 500, 'Internal server error. Please try again.');
  }
};

// Get Payment History
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let query = `
      SELECT 
        id, screenshot_url, original_filename, file_size, mime_type,
        amount, transaction_id, payment_method, status, 
        verification_remarks, verified_at, created_at
      FROM payment_screenshots 
      WHERE user_id = ?
    `;
    
    const params = [userId];

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    // Execute query
    const [payments] = await pool.execute(query, params);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM payment_screenshots WHERE user_id = ?`;
    const [countResult] = await pool.execute(countQuery, [userId]);

    return sendSuccess(res, {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    }, 'Payment history retrieved successfully');

  } catch (error) {
    console.error('Get payment history error:', error);
    return sendError(res, 500, 'Failed to fetch payment history');
  }
};



// controllers/adminController.js mein add karo

// Get pending payments
export const getPendingPayments = async (req, res) => {
    try {
        const [payments] = await pool.execute(`
            SELECT ps.*, u.name as user_name, u.email 
            FROM payment_screenshots ps
            JOIN users u ON ps.user_id = u.id
            WHERE ps.status = 'pending'
            ORDER BY ps.created_at DESC    
        `);

        console.log(`Found ${payments.length} pending payments`);
        
        sendSuccess(res, payments, 'Pending payments retrieved');
    } catch (error) {
        console.error('Error fetching payments:', error);
        sendError(res, 500, 'Error fetching payments');
    }
};



// Verify payment
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, remarks = '' } = req.body;
        const adminId = req.user.id;

        // 1. Payment verify
        const [result] = await pool.execute(
            `UPDATE payment_screenshots 
             SET status = 'verified', verified_by = ?, verification_remarks = ?, verified_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [adminId, remarks, paymentId]
        );

        if (result.affectedRows === 0) {
            return sendError(res, 400, 'Payment not found or already processed');
        }

        // 2. Get payment details with user info
        const [payments] = await pool.execute(
            `SELECT ps.*, u.name as user_name, u.email 
             FROM payment_screenshots ps
             JOIN users u ON ps.user_id = u.id
             WHERE ps.id = ?`,
            [paymentId]
        );
        const payment = payments[0];

        // 3. Update user balance
        await pool.execute(
            `UPDATE users 
             SET total_balance = total_balance + ?, total_coins = total_coins + ?
             WHERE id = ?`,
            [payment.amount, payment.amount, payment.user_id]
        );

        // 4. Frontend ke liye email template send karo
        const emailTemplate = paymentVerifiedTemplate(
            payment.user_name, 
            payment.amount, 
            payment.transaction_id
        );

        sendSuccess(res, { 
            paymentId, 
            amount: payment.amount,
            user_email: payment.email,
            user_name: payment.user_name,
            email_template: emailTemplate,
            action: "verified"
        }, 'Payment verified and balance updated');

    } catch (error) {
        console.error('Verify error:', error);
        sendError(res, 500, 'Error verifying payment');
    }
};

// Reject payment
export const rejectPayment = async (req, res) => {
    try {
        const { paymentId, rejection_reason = '' } = req.body;
        const adminId = req.user.id;

        // 1. Payment reject
        const [result] = await pool.execute(
            `UPDATE payment_screenshots 
             SET status = 'rejected', verified_by = ?, verification_remarks = ?, verified_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [adminId, rejection_reason, paymentId]
        );

        if (result.affectedRows === 0) {
            return sendError(res, 400, 'Payment not found or already processed');
        }

        // 2. Get payment details with user info
        const [payments] = await pool.execute(
            `SELECT ps.*, u.name as user_name, u.email 
             FROM payment_screenshots ps
             JOIN users u ON ps.user_id = u.id
             WHERE ps.id = ?`,
            [paymentId]
        );
        const payment = payments[0];

        // 3. Frontend ke liye email template send karo
        const emailTemplate = paymentRejectedTemplate(
            payment.user_name, 
            payment.amount, 
            rejection_reason
        );

        sendSuccess(res, { 
            paymentId, 
            amount: payment.amount,
            rejection_reason: rejection_reason,
            user_email: payment.email,
            user_name: payment.user_name,
            email_template: emailTemplate,
            action: "rejected"
        }, 'Payment rejected successfully');

    } catch (error) {
        console.error('Reject payment error:', error);
        sendError(res, 500, 'Error rejecting payment');
    }
};





// update users balance by admin  

export const updateBalanceByAdmin = async (req, res) => {
    try {
        const { user_id, total_coins, total_balance } = req.body;

        // Validation
        if (!user_id || total_coins === undefined || total_balance === undefined) {
            return sendError(res, 400, 'User ID, total coins and total balance are required');
        }

        const coins = parseFloat(total_coins);
        const balance = parseFloat(total_balance);

        if (isNaN(coins) || isNaN(balance) || coins < 0 || balance < 0) {
            return sendError(res, 400, 'Coins and balance must be valid positive numbers');
        }

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, name, unique_id FROM users WHERE id = ?',
            [user_id]
        );

        if (users.length === 0) {
            return sendError(res, 404, 'User not found');
        }

        const currentUser = users[0];

        // Direct UPDATE query for users table
        const [result] = await pool.execute(
            `UPDATE users 
             SET total_coins = ?, total_balance = ?, updated_at = NOW() 
             WHERE id = ?`,
            [coins, balance, user_id]
        );

        if (result.affectedRows === 0) {
            return sendError(res, 500, 'Failed to update user balance');
        }

        sendSuccess(res, {
            user_id,
            user_name: currentUser.name,
            unique_id: currentUser.unique_id,
            total_coins: coins,
            total_balance: balance
        }, 'User balance updated successfully');

    } catch (error) {
        console.error('Update balance error:', error);
        sendError(res, 500, 'Error updating user balance');
    }
};

//

export const getApprovedPayments = async (req, res) => {
  try {
    const [payments] = await pool.execute(
      `SELECT 
        ps.*,
        u.name as user_name,
        u.email as user_email,
        u.unique_id
       FROM payment_screenshots ps
       JOIN users u ON ps.user_id = u.id
       WHERE ps.status = 'verified'
       ORDER BY ps.verified_at DESC`
    );

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};  



export const getMyPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [payments] = await pool.execute(
      `SELECT * FROM payment_screenshots 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      total: payments.length,
      payments: payments
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};