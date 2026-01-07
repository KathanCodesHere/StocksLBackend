import pool from "../config/database.config.js";

export const addEnquiry=async(req,res)=>{
    const {name,email,message}=req.body;
    try{
        const q='insert into enquiry (name,email,message) values (?,?,?)';
        const [result]=await pool.execute(q,[name,email,message]);
        res.json({
            message:"Enquiry added successfully",
            success:true
        })
    }
    catch(err){
        console.log(err);
        res.json({
            message:"Enquiry not added",
            success:true
        })
    }
} 