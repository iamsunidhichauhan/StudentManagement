const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secretKey = "secret_key";
const User = require("../models/user");
const OTP = require("../models/otp");
const Class = require("../models/class");
const {
  validateFullName,
  validateContact,
  validateDOB,
  validateEmail,
} = require("../validations/validator");

// updateRole to admin
const updateRole = async (req, res) => {
  try {
    const role = "admin";
    const _id = req.body._id;
    if (!req.user || req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Only superadmins can update roles." });
    }
    const existingUser = await User.findById(_id).select("-password");
    if (!existingUser) {
      res.status(404).json("User not found!");
    }
    const originalCreatedAt = existingUser.createdAt;
    existingUser.role = role;

    // Save the user including the original created date
    await existingUser.save();

    // Include the original created date in the response
    const userResponse = {
      ...existingUser.toObject(),
      createdAt: originalCreatedAt, // Include the original created date
    };
    res
      .status(201)
      .json({ message: "User updated successfully.", user: userResponse });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};



// update user:
const updateUser = async (req, res) => {
  try {
    const userId = req.body._id;
    const userData = req.body; // Updated data
    delete userData.password;

    if (!userId) {
      return res.status(400).json("Please provide userId");
    }
    // Validate other fields only if they are included in the update request
    const { fullName, contact, DOB, email } = req.body;

    // Check if email is being updated
    if (email !== undefined) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res
          .status(400)
          .json({
            message: "Email already exists. Please choose a different email.",
          });
      }

      const emailErrors = validateEmail(email);
      if (emailErrors.length) {
        return res.status(400).json({ message: emailErrors.join(" ") });
      }
    }

    // Perform validation for other fields
    const fullNameErrors =
      fullName !== undefined ? validateFullName(fullName) : [];
    const contactErrors = contact !== undefined ? validateContact(contact) : [];
    const DOBErrors = DOB !== undefined ? validateDOB(DOB) : [];

    const errors = [...fullNameErrors, ...contactErrors, ...DOBErrors];

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(" ") });
    }
    // Store the current date for updating the updatedAt field
    const currentDate = new Date();

    // Update the user data in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...userData, updatedAt: currentDate }, // Include updatedAt field with current date
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Exclude password from the response
    const userResponse = { ...updatedUser.toObject(), password: undefined };
    console.log(userResponse)
    res
      .status(200)
      .json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Get all Students

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res
      .status(200)
      .json({ message: "Students fetched successfully!", students: students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");
    res
      .status(200)
      .json({ message: "Teachers fetched successfully!", teachers: teachers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const getMyDetails = async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log("userid at getMyDetails", userId);
  
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      let userToSend = user.toObject(); // Create a new object from the user document
  
      if (user.role === "admin") {
        delete userToSend.classNumber; // Delete the classNumber property from the new object
      }
  
      res.status(200).json({ message: "Logged-in User Details", user: userToSend });
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
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json("user Deleted.");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// findAll
const getAllUsers = async (req, res) => {
  try {
    const foundUsers = await User.find({}).select("-password");
    res
      .status(200)
      .json({ message: "users fetched successfully!", users: foundUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// findOne
const getOneUser = async (req, res) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(404).json({ message: "please provide userId." });
      }
  
      const foundUser = await User.findOne({ _id: userId }).select("-password");
      if (!foundUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      console.log("role of found user", foundUser.role);
  
      let userToSend = foundUser.toObject(); // Create a new object from the foundUser document
  
      if (foundUser.role === "admin") {
        delete userToSend.classNumber; // Delete the classNumber property from the new object
      }
  
      console.log("found user", userToSend);
      res.status(200).json({ message: "user found:", data: userToSend });
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
    console.error("Error cleaning up expired OTPs:", error);
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
