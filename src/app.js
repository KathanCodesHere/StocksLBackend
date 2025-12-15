import express from "express";
import helmet from "helmet";
import { corsMiddleware } from "./config/cors.config.js";
import { sendResponse } from "./utils/responseHandler.js";
import authRouter from "./router/auth.router.js"; 
import paymentRouter from "./router/payment.router.js";
import widrowRouter from "./router/widrow.router.js";
import adminPaymentRouter from "./router/admin.payement.router.js";
import kycRouter from "./router/kyc.routes.js";
import { verifyEmailConnection } from "./config/email.config.js";
 import stockRouter from "./router/stock.router.js";
const app = express() 


 app.use(express.json())
 app.use(express.urlencoded({ extended: true }));
 app.use(helmet({
   contentSecurityPolicy: false,
   crossOriginResourcePolicy: false,
 }))
app.use(corsMiddleware)

 app.use('/api/health',(req,res)=>{
    console.log("all good")
    sendResponse(res,200,{message:"helath checked successfully"},"all good")
 })

 //auth 
 app.use("/api/auth" , authRouter)  
 app.use("/api/payment" ,paymentRouter) // user deposit
 app.use("/api/widrow" , widrowRouter)  // widrow
 app.use("/api/admin/payment" , adminPaymentRouter)   
 app.use("/api/kyc" , kycRouter)  
 app.use("/api/stocks" , stockRouter)  
verifyEmailConnection()
 export default app;