// utils/emailTemplates.js

export const userApprovalTemplate = (userName, uniqueId) => {
    return {
        subject: " Your Account Has Been Approved!",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22c55e;">Account Approved Successfully!</h2>
                <p>Dear <strong>${userName}</strong>,</p>
                <p>We are pleased to inform you that your account has been approved by our admin team.</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #334155;">Your Account Details:</h3>
                    <p><strong>Unique ID:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${uniqueId}</strong></p>
                    <p><strong>Status:</strong> <span style="color: #22c55e;">Approved ✅</span></p>
                </div>

                <p>You can now login and start using all the features of our platform.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px;">
                        Best Regards,<br>
                        <strong>Octa Finance Team</strong>
                    </p>
                </div>
            </div>
        `,
        type: "approval"
    };
};

// utils/emailTemplates.js
export const userRejectionTemplate = (userName, rejectionReason) => {
    return {
        subject: " Account Approval Request Declined - Octa Finance",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Account Approval Declined</h2>
                <p>Dear <strong>${userName}</strong>,</p>
                <p>We regret to inform you that your account approval request has been declined by our admin team.</p>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <h3 style="color: #dc2626;">Reason for Rejection:</h3>
                    <p style="color: #7f1d1d; font-style: italic;">"${rejectionReason}"</p>
                </div>

                <p>Please review your application and submit again with correct information.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px;">
                        Best Regards,<br>
                        <strong>Octa Finance Team</strong>
                    </p>
                </div>
            </div>
        `,
        type: "rejection"
    };
};




// utils/emailTemplates.js

// Payment Verified Template
export const paymentVerifiedTemplate = (userName, amount, transactionId) => {
    return {
        subject: " Payment Verified Successfully - Octa Finance",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22c55e;">Payment Verified Successfully!</h2>
                <p>Dear <strong>${userName}</strong>,</p>
                <p>Your payment of <strong>₹${amount}</strong> has been verified and your wallet has been credited successfully.</p>
                
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <h3 style="color: #166534;">Payment Details:</h3>
                    <p><strong>Amount:</strong> ₹${amount}</p>
                    <p><strong>Status:</strong> <span style="color: #22c55e;">Verified ✅</span></p>
                    ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
                    <p><strong>Credited At:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <p>You can now use your balance for investments and withdrawals.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px;">
                        Best Regards,<br>
                        <strong>Octa Finance Team</strong>
                    </p>
                </div>
            </div>
        `,
        type: "payment_verified"
    };
};

// Payment Rejected Template
export const paymentRejectedTemplate = (userName, amount, rejectionReason) => {
    return {
        subject: " Payment Rejected - Octa Finance",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Payment Rejected</h2>
                <p>Dear <strong>${userName}</strong>,</p>
                <p>Your payment of <strong>₹${amount}</strong> has been rejected by our admin team.</p>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <h3 style="color: #dc2626;">Rejection Reason:</h3>
                    <p style="color: #7f1d1d; font-style: italic;">"${rejectionReason}"</p>
                </div>

                <p>Please upload a new payment screenshot with correct details.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px;">
                        Best Regards,<br>
                        <strong>Octa Finance Team</strong>
                    </p>
                </div>
            </div>
        `,
        type: "payment_rejected"
    };
};  




// utils/emailTemplates.js

// Withdrawal Approved Template
export const withdrawalApprovedTemplate = (userName, amount, transactionDetails) => {
    return {
        subject: " Withdrawal Approved - Octa Finance",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22c55e;">Withdrawal Approved Successfully!</h2>
                <p>Dear <strong>${userName}</strong>,</p>
                <p>Your withdrawal request of <strong>₹${amount}</strong> has been approved and processed successfully.</p>
                
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <h3 style="color: #166534;">Withdrawal Details:</h3>
                    <p><strong>Amount:</strong> ₹${amount}</p>
                    <p><strong>Status:</strong> <span style="color: #22c55e;">Approved ✅</span></p>
                    <p><strong>Processed At:</strong> ${new Date().toLocaleString()}</p>
                    ${transactionDetails ? `<p><strong>Transaction Details:</strong> ${transactionDetails}</p>` : ''}
                </div>

                <p>The amount will be credited to your bank account within 24-48 hours.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px;">
                        Best Regards,<br>
                        <strong>Octa Finance Team</strong>
                    </p>
                </div>
            </div>
        `,
        type: "withdrawal_approved"
    };
};

// Withdrawal Rejected Template
export const withdrawalRejectedTemplate = (userName, amount, rejectionReason) => {
    return {
        subject: " Withdrawal Rejected - Octa Finance",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Withdrawal Request Rejected</h2>
                <p>Dear <strong>${userName}</strong>,</p>
                <p>Your withdrawal request of <strong>₹${amount}</strong> has been rejected by our admin team.</p>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <h3 style="color: #dc2626;">Rejection Reason:</h3>
                    <p style="color: #7f1d1d; font-style: italic;">"${rejectionReason}"</p>
                </div>

                <p>Please check your account details and submit a new withdrawal request.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px;">
                        Best Regards,<br>
                        <strong>Octa Finance Team</strong>
                    </p>
                </div>
            </div>
        `,
        type: "withdrawal_rejected"
    };
};