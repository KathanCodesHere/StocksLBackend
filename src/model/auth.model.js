import pool from "../config/database.config.js";

export const createUser = async (userData) => {
  try {
    const {
      name,
      phone,
      email,
      bank_account_number,
      bank_name,
      password_hash,
    } = userData;

    const [result] = await pool.execute(
      `INSERT INTO users 
             (name, phone, email, bank_account_number,  password_hash, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
      [name, phone, email, bank_account_number, password_hash]
    );

    return {
      success: true,
      userId: result.insertId,
      message: "User registered successfully. Waiting for approval.",
    };
  } catch (error) {
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return users[0];
};

export const pendingUserForAprove = async () => {
  const [users] = await pool.execute(
    `SELECT id ,name , phone , email , status
         FROM users 
         WHERE status ='pending'
         ORDER BY created_at DESC`
  );

  return users;
};

// User approve query
export const approveUserModel = async (email, uniqueId, adminId) => {
  const [result] = await pool.execute(
    `UPDATE users 
         SET status = 'approved',    
             unique_id = ?,           
             approved_by = ?,        
             approved_at = NOW()     
         WHERE email = ? AND status = 'pending'`,
    [uniqueId, adminId, email]
  );
  return result;
};

// get user by unique id

export const getUserByUniqueId = async (uniqueId) => {
  try {
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE unique_id = ?",
      [uniqueId]
    );
    return users[0];
  } catch (error) {
    throw error;
  }
};
