const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secretKey = "secret_key";
const User = require("../models/user");
const OTP = require("../models/otp");
const Class = require('../models/class');




// updateRole to admin
const updateRole = async(req,res)=>{
    try {
        const role = "admin";
        const _id = req.body._id;
        if (!req.user || req.user.role !== "superadmin") {
            return res.status(403).json({ message: "Only superadmins can update roles." });
        }
        const existingUser= await User.findById({_id}).select('-password');
        if(!existingUser){
            res.status(404).json("user not found!")
        }
        existingUser.role = role;
        await existingUser.save();
        res.status(201).json({ message: "User updated successfully.", user: existingUser });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: error.message})
    }
}

// update user
const updateUser = async (req, res) => {
    try {
    const userId = req.body._id;
    const userData = req.body; // Updated data
    delete userData.password;
    if(!userId){
        return res.status(400).json("please provide userId")
    }
    const updatedUser = await User.findByIdAndUpdate(userId, userData, { new: true, select: '-password' });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all Students

const getStudents=  async (req, res) => {
    try {
        const students = await User.find({ role: "student" }).select('-password');
        res.status(200).json({ message: "Students fetched successfully!", students: students });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all Teachers
const getTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: "teacher" }).select('-password'); 
        res.status(200).json({ message: "Teachers fetched successfully!", teachers: teachers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// get my details
const getMyDetails = async (req, res) => {
    try {
        const userId = req.user.userId; 
        console.log("userid at getMyDetails",userId)
        const user = await User.findById(userId).select('-password'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: "Logged-in User Details", user: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// delete
const deleteUser = async (req, res) => {
    const userId = req.body._id; // Getting userid from the request parameters

    try {
        const deletedUser = await User.findByIdAndDelete(userId); 
        if (!deletedUser) { 
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json("user Deleted."); 
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
};

// findAll
const getAllUsers =  async (req, res) => {
    try {
        const foundUsers = await User.find({}).select('-password');
        res.status(200).json({ message: "users fetched successfully!", users: foundUsers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// findOne
const getOneUser = async (req, res) => {
    try {
        const userId = req.body.userId;
        if (!userId) { 
            return res.status(404).json({ message: 'please provide userId.' });
        };        
        const foundUser = await User.findOne({ _id: userId }).select('-password'); 
        if (!foundUser) { 
            return res.status(404).json({ message: 'User not found' });
        };        
        res.status(200).json({ message: "user found:", data: foundUser });
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
};


//clean up expired OTPs
async function cleanupExpiredOTP() {
    try {
        const now = new Date();
        // Find and delete expired OTP documents
        await OTP.deleteMany({ expiry: { $lt: now } }).exec();
        // console.log('Expired OTPs cleaned up successfully.');
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error);
    }
}
// Run cleanup 
setInterval(cleanupExpiredOTP, 60000);









module.exports = {
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
  updateRole,
  getStudents,
  getTeachers,
  getMyDetails,
};