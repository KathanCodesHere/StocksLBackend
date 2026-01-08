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

export const viewEnquiry=async(req,res)=>{
    try{
        const q='select * from enquiry';
        const [result]=await pool.execute(q);
        res.json({
            data:result,
            message:"Enquiry getting successfully",
            success:true
        })
    }
    catch(err){
        console.log(err);
        res.json({
            message:"Enquiry not got successfull",
            success:true
        })
    }
}