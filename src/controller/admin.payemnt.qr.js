import cloudinary from "../config/cloudanary.config.js";

import pool from "../config/database.config.js";

export const createPaymentMethod = async (req, res) => {
  try {
    const {
      account_number = null,
      ifsc_code = null,
      bank_name = null,
      branch_name = null,
      upi_id = null,
      is_active = 1,
    } = req.body || {};

    let qr_image_url = null;

    // Agar QR image hai to Cloudinary pe upload karo
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "payment_qr",
            public_id: `qr_${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      qr_image_url = uploadResult.secure_url;
    }

    // Database mein insert karo
    const [result] = await pool.execute(
      `INSERT INTO admin_payment_methods 
       ( qr_image_url, account_number, ifsc_code, 
        bank_name, branch_name, upi_id, is_active) 
       VALUES ( ?, ?, ?, ?, ?, ?, ?)`,
      [
        qr_image_url,
        account_number || null,
        ifsc_code || null,
        bank_name || null,
        branch_name || null,
        upi_id || null,
        is_active,
      ]
    );

    res.json({
      success: true,
      message: "Payment method created",
      id: result.insertId,
      qr_image_url: qr_image_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllPaymentMethods = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM admin_payment_methods ORDER BY id DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    // ✅ Convert all undefined to null
    const account_number = body.account_number ?? null;
    const ifsc_code = body.ifsc_code ?? null;
    const bank_name = body.bank_name ?? null;
    const branch_name = body.branch_name ?? null;
    const upi_id = body.upi_id ?? null;
    const is_active = body.is_active ?? 1;

    let qr_image_url = null;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "payment_qr",
            public_id: `qr_${id}_${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      qr_image_url = uploadResult.secure_url;
    }

    if (!qr_image_url) {
      const [oldData] = await pool.execute(
        "SELECT qr_image_url FROM admin_payment_methods WHERE id = ?",
        [id]
      );
      qr_image_url = oldData[0]?.qr_image_url ?? null;
    }

    // ✅ Nullish coalescing operator (??) ensures no undefined
    const [result] = await pool.execute(
      `UPDATE admin_payment_methods 
       SET qr_image_url = ?,
           account_number = ?,
           ifsc_code = ?,
           bank_name = ?,
           branch_name = ?,
           upi_id = ?,
           is_active = ?
       WHERE id = ?`,
      [
        qr_image_url ?? null,
        account_number ?? null,
        ifsc_code ?? null,
        bank_name ?? null,
        branch_name ?? null,
        upi_id ?? null,
        is_active ?? 1,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.json({
      success: true,
      message: "Updated",
      id: id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};