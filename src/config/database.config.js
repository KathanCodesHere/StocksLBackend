import { databaseSecret } from "./env.config.js";
import mysql from "mysql2/promise"; 

const pool = mysql.createPool({
    // host:"127.0.0.1" || databaseSecret.DATABASE_HOST,
    host: databaseSecret.DATABASE_HOST,
    user:databaseSecret.DATABASE_USER || "root",
    password:databaseSecret.DATABASE_PASSWORD,
    database:databaseSecret.DATABASE_NAME,
    port:databaseSecret.DATABASE_PORT || 3306 , 
    connectionLimit:10,
    queueLimit:0,
    waitForConnections:true,
})


export const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Database connection successful");
        connection.release();
        console.log("Connection released");
    } catch (error) {
        console.log("Database connection failed", error);
        throw error;
    }
}


export default pool;
