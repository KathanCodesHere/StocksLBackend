
export const agenAdmintonly = (req, res, next) => {
    try {
        const userType = req.user.userType;
        
        if (userType !== 'admin' && userType !== 'agent') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Sirf admin ya agent hi access kar sakte hain.'
            });
        }
        
        console.log(`Agent access granted: ${req.user.name}`);
        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

