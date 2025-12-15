
export const adminOnly = (req, res, next) => {
    try {
        const userType = req.user.userType;
        
        if (userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Sirf admin hi access kar sakta hai.'
            });
        }
        
        console.log(`Admin access granted: ${req.user.name}`);
        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

