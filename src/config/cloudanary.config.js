// config/cloudinary.config.js
import { v2 as cloudinary } from 'cloudinary';
import { cloudinarySecret } from './env.config.js';




cloudinary.config({
  cloud_name: cloudinarySecret.CLOUDINARY_CLOUD_NAME,
  api_key: cloudinarySecret.CLOUDINARY_API_KEY,
  api_secret: cloudinarySecret.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;