import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        // 1. Token get karo headers se
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        // 2. Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token nahi hai.'
            });
        }
        
        // 3. Token verify karo
        const decoded = jwt.verify(token, "kathan12345");
        
        // 4. User info attach karo request mein
        req.user = {
            id: decoded.id,
            email: decoded.email, 
            userType: decoded.userType,
            name: decoded.name
        };
        
        console.log(` Token verified: ${decoded.name} (${decoded.userType})`);
        
        // 5. Next function call karo
        next();
        
    } catch (error) {
        console.log(' Token verification failed:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

