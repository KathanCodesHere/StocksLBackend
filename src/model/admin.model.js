import pool from "../config/database.config.js"; 

export const getAdminByEmail = async (email) => {
    const [admins] = await pool.execute(
        `SELECT id, name, email, role, permissions, is_active 
         FROM admins 
         WHERE email = ?`,
        [email]
    );
    return admins[0];
};


// models/user.model.js

// APPROVED USERS LIST
export const getApprovedUsers = async () => {
    try {
        const [users] = await pool.execute(
            `SELECT id, unique_id, name, email, phone, bank_account_number, 
                    approved_by, approved_at, total_coins, total_balance, created_at
             FROM users 
             WHERE status = 'approved'
             ORDER BY approved_at DESC`
        ); 
        return users;
    } catch (error) {
        throw error;
    }
};