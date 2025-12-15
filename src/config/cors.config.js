
import { urlSecret } from "./env.config.js";
import cors from "cors";


const corsOptions = {
    origin: function(origin, callback) {
        const allowedOrigins = [
            urlSecret.FRONTEND_URL,
            urlSecret.PRODUCTION_URL,
        ].filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));

        // Development mode - allow all
        if(urlSecret.NODE_ENV === "development") {
            console.log(' Development - Allowing origin:', origin);
            return callback(null, true);
        }

        // Production mode - strict check
        if(urlSecret.NODE_ENV === "production") {
            // Allow requests with no origin (mobile apps, postman, etc.)
            if(!origin || allowedOrigins.indexOf(origin) !== -1) {
                console.log(' Production - Allowed origin:', origin);
                return callback(null, true);
            } else {
                console.log(' Production - Blocked origin:', origin);
                return callback(new Error("Not allowed by CORS"))
            }
        }

        // For other environments (staging, test, etc.)
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"]
};


export const corsMiddleware = cors(corsOptions);