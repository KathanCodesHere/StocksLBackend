import nodemailer from 'nodemailer' 
import { emailSecret } from './env.config.js' 




export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:emailSecret.EMAIL_USER,
        pass:emailSecret.EMAIL_PASS
    }
});

// Test email connection
export const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email server connected');
        return true;
    } catch (error) {
        console.log('Email connection failed:', error.message);
        return false;
    }
};