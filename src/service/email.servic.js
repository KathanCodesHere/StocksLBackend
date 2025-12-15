
import { transporter } from "../config/email.config.js";
import { approvalEmailTemplate } from "../utils/emailTemplate.js"; 
import { emailSecret } from "../config/env.config.js";

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from:emailSecret.EMAIL_FROM || "dangi.pawan2001@gmail.com",
            to: to,
            subject: subject,
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${to}`);
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        console.error(` Email failed to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

// Specific Email Functions
export const sendApprovalEmail = async (userEmail, uniqueId, userName) => {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const subject = ' Account Approved - Your Unique ID';
    const html = approvalEmailTemplate(userName, uniqueId, loginUrl);
    
    return await sendEmail(userEmail, subject, html);
};
