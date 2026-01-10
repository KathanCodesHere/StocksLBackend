import pool from "../config/database.config.js";
import { sendError } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/responseHandler.js"; 
import { withdrawalApprovedTemplate , withdrawalRejectedTemplate } from "../utils/emailTemplate.js";
import cloudinary from "../config/cloudanary.config.js";



export const requestWithdrawal = async (req, res) => {
    try {
        // Check if file is uploaded
    if (!req.file) {
      return sendError(res, 400, 'Please upload payment screenshot');
    }
        const { amount } = req.body;
        const userId = req.user.id;

        console.log(` User ${userId} withdrawal request: ₹${amount}`);

        // Validation
        if (!amount || amount <= 0) {
            return sendError(res, 400, 'Valid amount required');
        }

        // Check user balance
        const [users] = await pool.execute(
            'SELECT total_balance, bank_account_number, bank_name, ifsc_code FROM users WHERE id = ?',
            [userId]
        );
        const user = users[0];
        console.log(user);
        console.log(amount);
        if (!user) {
            return sendError(res, 404, 'User not found');
        }

        if (Number(user.total_balance) < amount) {
            return sendError(res, 400, 'Insufficient balance');
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

        // Create withdrawal request
        const [result] = await pool.execute(
            `INSERT INTO withdrawal_requests 
             (user_id, screenshot_url, original_filename, file_size, mime_type, 
        amount, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                userId,
        uploadResult.secure_url,        // Cloudinary URL
        req.file.originalname,          // Original filename
        req.file.size,                  // File size in bytes
        req.file.mimetype,              // MIME type
        parseFloat(amount),             // Convert to number
        ]
        );

        console.log(` Withdrawal request created: ${result.insertId}`);

        sendSuccess(res, {
            withdrawalId: result.insertId,
            screenshotUrl: uploadResult.secure_url,
            amount: amount,
            status: 'pending'
        }, 'Withdrawal request submitted successfully');

    } catch (error) {
        console.error('Withdrawal request error:', error);
        sendError(res, 500, 'Error submitting withdrawal request');
    }
};   



export const getPendingWithdrawals = async (req, res) => {
    try {
        console.log(' Fetching pending withdrawals...');
        
        const [withdrawals] = await pool.execute(`
            SELECT 
                wr.id, wr.amount, wr.bank_account_number, 
                wr.bank_name, wr.ifsc_code, wr.created_at,
                u.id as user_id, u.name as user_name, u.email, u.phone,
                u.total_balance
            FROM withdrawal_requests wr
            JOIN users u ON wr.user_id = u.id
            WHERE wr.status = 'pending'
            ORDER BY wr.created_at DESC
        `);

        console.log(` Found ${withdrawals.length} pending withdrawals`);
        
        sendSuccess(res, withdrawals, 'Pending withdrawals retrieved successfully');

    } catch (error) {
        console.error('Error fetching pending withdrawals:', error);
        sendError(res, 500, 'Error fetching pending withdrawals');
    }
};  




// PROCESS WITHDRAWAL (APPROVE)
export const processWithdrawal = async (req, res) => {
    try {
        const { withdrawalId, remarks = '' } = req.body;
        const adminId = req.user.id;

        console.log(`Admin ${adminId} approving withdrawal ${withdrawalId}`);

        // 1. Withdrawal details with user info get karo
        const [withdrawals] = await pool.execute(
            `SELECT wr.*, u.name as user_name, u.email 
             FROM withdrawal_requests wr
             JOIN users u ON wr.user_id = u.id
             WHERE wr.id = ? AND wr.status = 'pending'`,
            [withdrawalId]
        );

        if (withdrawals.length === 0) {
            return sendError(res, 400, 'Withdrawal not found or already processed');
        }
        const withdrawal = withdrawals[0];

        // 2. Check user balance
        const [users] = await pool.execute(
            'SELECT total_balance FROM users WHERE id = ?',
            [withdrawal.user_id]
        );
        const user = users[0];

        // STRING TO NUMBER CONVERSION
        const userBalance = parseFloat(user.total_balance);
        const withdrawalAmount = parseFloat(withdrawal.amount);

        if (userBalance < withdrawalAmount) {
            return sendError(res, 400, 'User has insufficient balance');
        }

        // 3. Withdrawal status update karo (DIRECT 'processed')
        const [result] = await pool.execute(
            `UPDATE withdrawal_requests 
             SET status = 'processed', processed_by = ?, remarks = ?, processed_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [adminId, remarks, withdrawalId]
        );

        // 4. User balance update karo
        await pool.execute(
            `UPDATE users 
             SET total_balance = total_balance - ?,
                 total_coins = total_coins - ?
             WHERE id = ?`,
            [withdrawal.amount, withdrawal.amount, withdrawal.user_id]
        );

        // 5. Frontend ke liye email template send karo
        const emailTemplate = withdrawalApprovedTemplate(
            withdrawal.user_name, 
            withdrawal.amount, 
            remarks
        );

        console.log(`Approved withdrawal ${withdrawalId}. Deducted ₹${withdrawal.amount} from user ${withdrawal.user_id}`);

        sendSuccess(res, {
            withdrawalId: withdrawalId,
            amount: withdrawal.amount,
            userId: withdrawal.user_id,
            user_email: withdrawal.email,
            user_name: withdrawal.user_name,
            email_template: emailTemplate,
            action: "approved"
        }, 'Withdrawal approved successfully');

    } catch (error) {
        console.error('Process withdrawal error:', error);
        sendError(res, 500, 'Error processing withdrawal');
    }
};

// REJECT WITHDRAWAL
export const rejectWithdrawal = async (req, res) => {
    try {
        const { withdrawalId, rejection_reason = '' } = req.body;
        const adminId = req.user.id;

        console.log(`Admin ${adminId} rejecting withdrawal ${withdrawalId}`);

        // 1. Withdrawal details with user info get karo
        const [withdrawals] = await pool.execute(
            `SELECT wr.*, u.name as user_name, u.email 
             FROM withdrawal_requests wr
             JOIN users u ON wr.user_id = u.id
             WHERE wr.id = ? AND wr.status = 'pending'`,
            [withdrawalId]
        );

        if (withdrawals.length === 0) {
            return sendError(res, 400, 'Withdrawal not found or already processed');
        }
        const withdrawal = withdrawals[0];

        // 2. Withdrawal status update karo (rejected)
        const [result] = await pool.execute(
            `UPDATE withdrawal_requests 
             SET status = 'rejected', processed_by = ?, remarks = ?, processed_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [adminId, rejection_reason, withdrawalId]
        );

        // 3. Frontend ke liye email template send karo
        const emailTemplate = withdrawalRejectedTemplate(
            withdrawal.user_name, 
            withdrawal.amount, 
            rejection_reason
        );

        console.log(`Rejected withdrawal ${withdrawalId} for user ${withdrawal.user_id}`);

        sendSuccess(res, {
            withdrawalId: withdrawalId,
            amount: withdrawal.amount,
            userId: withdrawal.user_id,
            user_email: withdrawal.email,
            user_name: withdrawal.user_name,
            rejection_reason: rejection_reason,
            email_template: emailTemplate,
            action: "rejected"
        }, 'Withdrawal rejected successfully');

    } catch (error) {
        console.error('Reject withdrawal error:', error);
        sendError(res, 500, 'Error rejecting withdrawal');
    }
};



export const getMyWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [withdrawals] = await pool.execute(
      `SELECT * FROM withdrawal_requests 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      total: withdrawals.length,
      withdrawals: withdrawals
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};