import { sendError } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
import pool from "../config/database.config.js";
import cloudinary from "../config/cloudanary.config.js";

// POST - Create/Submit KYC
export const createKYC = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      email,
      address,
      city,
      state,
      aadhaar_no,
      pan_number,
      account_no,
      bank,
      ifsc
    } = req.body;
   
    console.log(req.files)
    console.log("City received:", city);

    // Validate required fields
    if (!full_name || !aadhaar_no || !pan_number) {
      return sendError(res, 400, 'Full name, Aadhaar and PAN are required');
    }

    //  FIX: Handle city
    const finalCity = city && city.trim() !== '' ? city : 'Not Provided';
    console.log(finalCity)
    // Check if KYC already exists for user
    const [existing] = await pool.execute(
      'SELECT * FROM kyc WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      return sendError(res, 400, 'KYC already submitted for this user');
    }

    // Upload Aadhaar image to Cloudinary
    let aadhaar_image_url = null;
    if (req.files?.aadhaar_image) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'kyc_docs',
            public_id: `aadhaar_${userId}_${Date.now()}`,
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.aadhaar_image[0].buffer);
      });
      aadhaar_image_url = uploadResult.secure_url;
    }

    // Upload PAN image to Cloudinary
    let pancard_image_url = null;
    if (req.files?.pancard_image) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'kyc_docs',
            public_id: `pan_${userId}_${Date.now()}`,
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.pancard_image[0].buffer);
      });
      pancard_image_url = uploadResult.secure_url;
    }

    // Insert KYC into database
    const [result] = await pool.execute(
      `INSERT INTO kyc 
       (full_name, email, address, city, state, aadhaar_no, pan_number,
        account_no, bank, ifsc, aadhaar_image, pancard_image, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email || null,
        address || null,
        finalCity,
        state || null,
        aadhaar_no,
        pan_number,
        account_no || null,
        bank || null,
        ifsc || null,
        aadhaar_image_url,
        pancard_image_url,
        userId
      ]
    );

    //  FIX: Try to update kyc_status, but don't fail if column doesn't exist
    try {
      await pool.execute(
        'UPDATE users SET kyc_status = "pending" WHERE id = ?',
        [userId]
      );
      console.log(" kyc_status updated");
    } catch (updateError) {
      console.log("Could not update kyc_status (column may not exist):", updateError.message);
      // Continue without failing
    }

    sendSuccess(res, {
      kyc_id: result.insertId,
      user_id: userId,
      status: 'submitted'
    }, 'KYC submitted successfully and under review');

  } catch (error) {
    console.error('KYC submit error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 400, 'Aadhaar or PAN already registered');
    }
    
    sendError(res, 500, 'Error submitting KYC');
  }
};
// GET - Get KYC details for logged in user
export const getKYC = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return sendError(res, 403, 'Admin access required');
    }

    const [kycData] = await pool.execute(
      `SELECT 
        k.kyc_id, 
        k.full_name, 
        k.email, 
        k.address, 
        k.city, 
        k.state,
        k.aadhaar_no, 
        k.pan_number, 
        k.account_no, 
        k.bank, 
        k.ifsc,
        k.aadhaar_image, 
        k.pancard_image, 
        k.user_id,
        u.name as user_name,
        u.phone as user_phone,
        u.email as user_email,
        u.created_at as user_joined
       FROM kyc k
       LEFT JOIN users u ON k.user_id = u.id
       ORDER BY k.kyc_id DESC`
    );

    sendSuccess(res, {
      total: kycData.length,
      data: kycData
    }, 'All KYC data retrieved successfully');

  } catch (error) {
    console.error('Get all KYC error:', error);
    sendError(res, 500, 'Error fetching KYC data');
  }
};

