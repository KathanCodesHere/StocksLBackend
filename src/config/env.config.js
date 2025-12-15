import dotenv from "dotenv";
dotenv.config();


export const serverSecret = {
    PORT : process.env.PORT,
    SERVER_URL : process.env.SERVER_URL
}


export const urlSecret = {
    NODE_ENV:process.env.NODE_ENV,
    FRONTEND_URL:process.env.FRONTEND_URL,
    PRODUCTION_URL:process.env.PRODUCTION_URL
}


export const databaseSecret = {
   DATABASE_NAME:process.env.DATABASE_NAME,
    DATABASE_USER:process.env.DATABASE_USER,
  
    DATABASE_PORT:process.env.DATABASE_PORT,
    DATABASE_HOST:process.env.DATABASE_HOST,
    DATABASE_PASSWORD:process.env.DATABASE_PASSWORD,
}


export const emailSecret = {
EMAIL_USER:process.env.EMAIL_USER,
EMAIL_PASS: process.env.EMAIL_PASS,
EMAIL_FROM:process.env.EMAIL_FROM,
FRONTEND_URL:process.env.FRONTEND_URL
}   


export const cloudinarySecret = {
    CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET
}
