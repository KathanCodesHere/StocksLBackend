import { sendError } from "../utils/errorHandler.js";
import { sendSuccess } from "../utils/responseHandler.js";
import pool from "../config/database.config.js";
import cloudinary from "../config/cloudanary.config.js";

//POST: submit kyc 
export const createKYC = async (req, res) => {
  try {
    const userId = req.user.id;

    //IMPORTANT: destructure AFTER multer
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
      ifsc,
    } = req.body;

    // console.log("BODY:", req.body); // DEBUG
    // console.log("FILES:", req.files);

    //Required validation
    if (!full_name || !aadhaar_no || !pan_number) {
      return sendError(res, 400, "Full name, Aadhaar and PAN are required");
    }
   const rawCity =
  req.body.city ??
  req.body["city "] ??
  req.body["City"] ??
  null;

const finalCity =
  typeof rawCity === "string" && rawCity.trim().length > 0
    ? rawCity.trim()
    : "Not Provided";


    // Check existing KYC
    const [existing] = await pool.execute(
      "SELECT kyc_id FROM kyc WHERE user_id = ?",
      [userId]
    );

    if (existing.length) {
      return sendError(res, 400, "KYC already submitted for this user");
    }

    // ================= UPLOAD AADHAAR =================
    let aadhaar_image_url = null;
    if (req.files?.aadhaar_image?.[0]) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "kyc_docs",
            public_id: `aadhaar_${userId}_${Date.now()}`,
          },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        stream.end(req.files.aadhaar_image[0].buffer);
      });
      aadhaar_image_url = result.secure_url;
    }

    // ================= UPLOAD PAN =================
    let pancard_image_url = null;
    if (req.files?.pancard_image?.[0]) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "kyc_docs",
            public_id: `pan_${userId}_${Date.now()}`,
          },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        stream.end(req.files.pancard_image[0].buffer);
      });
      pancard_image_url = result.secure_url;
    }

    // ================= INSERT =================
    const [result] = await pool.execute(
      `INSERT INTO kyc (
        full_name, email, address, city, state,
        aadhaar_no, pan_number, account_no,
        bank, ifsc, aadhaar_image, pancard_image, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        userId,
      ]
    );

    // ================= UPDATE USER =================
    // await pool.execute(
    //   `UPDATE users SET kyc_status = 'pending' WHERE id = ?`,
    //   [userId]
    // );

    return sendSuccess(
      res,
      {
        kyc_id: result.insertId,
        status: "submitted",
      },
      "KYC submitted successfully"
    );
  } catch (error) {
    console.error("KYC Error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 400, "Aadhaar or PAN already registered");
    }

    return sendError(res, 500, "Error submitting KYC");
  }
};

// GET - Get KYC details for logged in user
export const getKYC = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== "admin") {
      return sendError(res, 403, "Admin access required");
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

    sendSuccess(
      res,
      {
        total: kycData.length,
        data: kycData,
      },
      "All KYC data retrieved successfully"
    );
  } catch (error) {
    console.error("Get all KYC error:", error);
    sendError(res, 500, "Error fetching KYC data");
  }
};
// GET - Get KYC details for logged in user
export const getKYCByUser = async (req, res) => {
  try {
    const userId = Number(req.user.id); //force number

    console.log("Fetching KYC for user:", userId);

    const [kyc] = await pool.execute(
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
        k.pancard_image
      FROM kyc k
      WHERE k.user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (kyc.length === 0) {
      return sendError(res, 404, "KYC not submitted yet");
    }

    sendSuccess(res, kyc[0], "KYC details fetched successfully");
  } catch (error) {
    console.error("Get my KYC error:", error);
    sendError(res, 500, "Error fetching KYC details");
  }
};
