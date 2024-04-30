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
  validateClassNumber,
  validateSubjects,
  validateUpdateSubjects,
} = require("../validations/validator");
const {
  updateUserAndClasses,
  updateUserSubjects,
  updateStudentSubjects
} = require("../operations/userOperations");

const { searchUsers,searchSubjects } = require("../operations/searchOperations");

// // findAll
// const getAllUsersbyGet = async (req, res) => {
//   try {
//     let foundUsers;

//     // Check if there are search parameters in the request body
//     if (Object.keys(req.body).length > 0) {
//       foundUsers = await searchUsers(req.body);
//     } else {
//       foundUsers = await User.find({}).select("-password");
//     }

//     // Check if no users were found
//     if (foundUsers.length === 0) {
//       return res.status(400).json({ message: "No data found." });
//     }

//     // Send the response with the found users
//     return res.status(200).json({ message: "Users fetched successfully!", users: foundUsers });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//     console.error("An error occurred:", error);
//   }
// };


const getAllUsersbyGet = async (req, res) => {
  try {
    let foundUsers;

    // Check if there are search parameters in the request body
    if (Object.keys(req.body).length > 0) {
      foundUsers = await searchUsers(req.body);
    } else {
      foundUsers = await User.find({}).select("-password");
    }

    // Check if no users were found and send appropriate response
    console.log("*")
    if (foundUsers.length === 0) {
      console.log("**")
      return res.status(404).json({ message: "No users found matching your search criteria." });
    }
    console.log("***")
    console.log("founduser is : ", foundUsers)

    // Send the response with the found users
    return res.status(200).json({ message: "Users fetched successfully!", users: foundUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("An error occurred:", error);
  }
};


const getAllUsersbyPost = async (req, res) => {
  try {
    let foundUsers;

    // Check if there are search parameters in the request body
    if (Object.keys(req.body).length > 0) {
      foundUsers = await searchUsers(req.body);
    } else {
      foundUsers = await User.find({}).select("-password");
    }

    res
      .status(200)
      .json({ message: "Users fetched successfully!", users: foundUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update User
// const updateUser = async (req, res) => {
//   try {
//     const userId = req.body._id;
//     if (!userId) {
//       return res.status(400).json("Please provide userId");
//     }
//     // Find the user document
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // updateUser function
//     if ("addToClass" in req.body) {
//       const addToClasses = Array.isArray(req.body.addToClass)
//         ? req.body.addToClass
//         : [req.body.addToClass];

//       const removeFromClasses = Array.isArray(req.body.removeFromClass)
//         ? req.body.removeFromClass
//         : [req.body.removeFromClass];

//       // Call updateUserAndClasses function to handle addToClass logic
//       await updateUserAndClasses(
//         req,
//         res,
//         user,
//         addToClasses,
//         removeFromClasses,
//         userId
//       );
//     }

//     // Validate other fields only if they are included in the update request
//     const { fullName, contact, DOB, email } = req.body;
//     console.log(req.body);

//     const errors = [];

//     // Check if email is being updated
//     if (email !== undefined) {
//       const existingUser = await User.findOne({ email });
//       if (existingUser && existingUser._id.toString() !== userId) {
//         return res.status(400).json({
//           message: "Email already exists. Please choose a different email.",
//         });
//       }

//       const emailErrors = validateEmail(email);
//       if (emailErrors.length) {
//         return res.status(400).json({ message: emailErrors.join(" ") });
//       }
//     }

//     // Perform validation for other fields
//     if (fullName !== undefined) {
//       const fullNameErrors = validateFullName(fullName);
//       errors.push(...fullNameErrors);
//     }

//     if (contact !== undefined) {
//       const contactErrors = validateContact(contact);
//       errors.push(...contactErrors);
//     }

//     if (DOB !== undefined) {
//       const DOBErrors = validateDOB(DOB);
//       errors.push(...DOBErrors);
//     }

//     if (errors.length > 0) {
//       return res.status(400).json({ message: errors.join(" ") });
//     }

//     // Update the user in the database
//     const updatedUser = await User.findOneAndUpdate(
//       { _id: userId },
//       { email, fullName, contact, DOB },
//       { new: true } // To return the updated document
//     );

//     if (updatedUser) {
//       return res.status(200).json({ message: "User updated successfully" });
//     } else {
//       return res.status(404).json({ message: "User not found" });
//     }
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

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

// // update user
const updateUser = async (req, res) => {
  try {
    const userId = req.body._id;
    const user = await User.findById(userId).select("-password");
    console.log(user);
    const role = user.role;

    if (!userId) {
      return res.status(400).json("Please provide userId");
    }

    // Validate fields only if they are present in the request
    const {
      fullName,
      contact,
      DOB,
      email,
      addToClass,
      removeFromClass,
      subjectToTeach,
      removeSubjectToTeach,
      subjectToStudy,
      removeSubjectToStudy
    } = req.body;

    // Validate fields only if they are present in the request
    const errors = [];
    if (fullName !== undefined) {
      errors.push(...validateFullName(fullName));
    }
    if (contact !== undefined) {
      errors.push(...validateContact(contact));
    }
    if (DOB !== undefined) {
      errors.push(...validateDOB(DOB));
    }
    if (email !== undefined) {
      errors.push(...validateEmail(email));
    }

    // Retrieve class details for validation
    let classDetails;
    if (user.classNumber && user.classNumber.length > 0) {
      // Assuming user has only one class number
      const classNumber = user.classNumber[0];
      classDetails = await Class.findOne({ classNumber });
      if (!classDetails) {
        errors.push("Class details not found for update.");
      }
    }

    // Validate subjects to add or remove
    const subjectValidationErrors = validateUpdateSubjects(
      subjectToTeach || [], // subjectsToAdd
      removeSubjectToTeach || [], // subjectsToRemove
      classDetails // Pass classDetails to validation function
    );

    if (subjectValidationErrors.length > 0) {
      errors.push(...subjectValidationErrors);
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    // Enroll user in classes
    const enrollmentErrors = await updateUserAndClasses(
      userId,
      role,
      addToClass,
      removeFromClass,
      user,
      subjectToTeach,
      removeSubjectToTeach
    );

    if (enrollmentErrors.length > 0) {
      return res.status(400).json({ message: enrollmentErrors.join(", ") });
    }

    // Update the classNumber in userData
    const updatedClassNumbers = new Set([
      ...(user.classNumber || []),
      ...(addToClass || []),
    ]);
    user.classNumber = [...updatedClassNumbers];

    // Remove classNumber from userData if present in removeFromClass
    if (removeFromClass !== undefined) {
      user.classNumber = user.classNumber.filter(
        (cn) => !removeFromClass.includes(cn)
      );
    }


    // Call updateUserSubjects to handle updating user subjects
    await updateUserSubjects(userId, role, req.body, user.classNumber);

    // Merge the new subjects with the existing ones
    let updatedSubjectToTeach = [...user.subjectToTeach];

    // Check if removeSubjectToTeach is present in the request body
    if (removeSubjectToTeach) {
      // Iterate over subjects to remove
      removeSubjectToTeach.forEach((subject) => {
        // Remove the subject from the updatedSubjectToTeach array
        updatedSubjectToTeach = updatedSubjectToTeach.filter(
          (existingSubject) => existingSubject !== subject
        );
      });
    }

    // Update the subjectToTeach field
    user.subjectToTeach = updatedSubjectToTeach;
    console.log("user.subjectToTeach is : ",user.subjectToTeach)

    // // Call updateStudentSubjects to update subjects
     await updateStudentSubjects(userId, role, req.body, user.classNumber);

    // Save the updated user
    await user.save();

    // Delete password field from user object
    delete user.password;
    console.log("user.password ", user.password);

    res.status(200).json({ message: "User updated successfully.", data: user });
  } catch (error) {
    console.error("An error occurred:", error);
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

    res
      .status(200)
      .json({ message: "Logged-in User Details", user: userToSend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  delete
const deleteUser = async (req, res) => {
  const userId = req.body._id; // Getting user ID from the request parameters

  try {
    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the user from all classes they are associated with
    const classes = await Class.find({
      $or: [
        { students: userId },
        { teachers: userId },
        { classTeacherId: userId },
      ],
    });

    for (const classObj of classes) {
      // Remove the user from students, teachers, and classTeacherId
      classObj.students.pull(userId);
      classObj.teachers.pull(userId);
      if (classObj.classTeacherId && classObj.classTeacherId.equals(userId)) {
        classObj.classTeacherId = null;
      }

      // Update total students and total teachers count
      classObj.totalStudents = classObj.students.length;
      classObj.totalTeachers = classObj.teachers.length;

      // Save the updated class object
      await classObj.save();
    }

    // Remove the user from the classTeacherOf array in other classes
    await Class.updateMany(
      { classTeacherId: userId },
      { $set: { classTeacherId: null } }
    );

    res.status(200).json({ message: "User deleted successfully." });
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

    // console.log("found user", userToSend);
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
  getAllUsersbyGet,
  getAllUsersbyPost,
  getOneUser,
  updateUser,
  deleteUser,
  updateRole,
  getStudents,
  getTeachers,
  getMyDetails,
};
