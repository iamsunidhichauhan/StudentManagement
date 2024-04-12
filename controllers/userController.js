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

// update user
const updateUser = async (req, res) => {
  try {
    const userId = req.body._id;
    const userData = req.body; // Updated data
    delete userData.password;
    const errors = [];

    if (!userId) {
      return res.status(400).json("Please provide userId");
    }

    // Fetch user's role and classNumbers
    const user = await User.findById(userId).select("role classNumber");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const role = user.role;
    const userClassNumbers = user.classNumber || []; // Handle cases where classNumber might be empty

    if ("addToClass" in userData || "removeFromClass" in userData) {
      const studentEnrollmentErrors = []; // New array to store student enrollment errors
      const invalidClasses = []; // Combined array for invalid class numbers
      const nonExistentClasses = [];

      // Combined loop for addToClass and removeFromClass
      for (const classNumber of [
        ...(userData.addToClass || []),
        ...(userData.removeFromClass || []),
      ]) {
        if (isNaN(classNumber) || classNumber < 1 || classNumber > 12) {
          invalidClasses.push(classNumber);
          continue; // Skip to the next iteration
        }

        const existingClass = await Class.findOne({ classNumber });
        if (
          !existingClass &&
          userData.addToClass &&
          userData.addToClass.includes(classNumber)
        ) {
          nonExistentClasses.push(classNumber);
        } else if (
          user.role === "student" &&
          userData.addToClass &&
          userData.addToClass.includes(classNumber) &&
          user.classNumber &&
          user.classNumber.length > 0
        ) {
          studentEnrollmentErrors.push(
            "Students can only be enrolled in one class at a time."
          );
        }
        console.log("user classNumber at existing class",user.classNumber)
      }

      // Error handling for validation errors
      if (invalidClasses.length > 0) {
        const errorMessage = `Invalid class numbers: ${invalidClasses.join(", ")}.`;
        return res.status(400).json({ message: errorMessage });
      }

      if (nonExistentClasses.length > 0) {
        const message = `Class with number ${nonExistentClasses.join(", ")} do not exist.`;
        return res.status(400).json({ message });
      }

      if (studentEnrollmentErrors.length > 0) {
        return res.status(400).json({ message: studentEnrollmentErrors[0] }); // Return only the first student enrollment error
      }

      // Validate other fields only if they are included in the update request
      const { fullName, contact, DOB, email } = req.body;

      // Check if email is being updated
      if (email !== undefined) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(400).json({
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
      const contactErrors =
        contact !== undefined ? validateContact(contact) : [];
      const DOBErrors = DOB !== undefined ? validateDOB(DOB) : [];

      fullNameErrors.forEach((error) => errors.push(error));
      contactErrors.forEach((error) => errors.push(error));
      DOBErrors.forEach((error) => errors.push(error));

      if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(" ") });
      }

      // Store the current date for updating the updatedAt field
      const currentDate = new Date();

      // Handle class assignment for teachers and students
      if (
        (role === "teacher" || role === "student") &&
        (req.body.removeFromClass || req.body.addToClass)
      ) {
        const removeFromClasses = Array.isArray(req.body.removeFromClass)
          ? req.body.removeFromClass
          : [req.body.removeFromClass];
        const addToClasses = Array.isArray(req.body.addToClass)
          ? req.body.addToClass
          : [req.body.addToClass];

        for (const classNumber of removeFromClasses) {
          const classObj = await Class.findOne({ classNumber });
          if (classObj) {
            // Check if the user is enrolled in the class before removing them
            if (
              (role === "teacher" && classObj.teachers.includes(userId)) ||
              (role === "student" && classObj.students.includes(userId))
            ) {
              if (role === "teacher") {
                classObj.teachers.pull(userId); // Remove teacher from class
                classObj.totalTeachers = classObj.totalTeachers
                  ? classObj.totalTeachers - 1
                  : 0; // Decrement totalTeachers count
              } else if (role === "student") {
                classObj.students.pull(userId); // Remove student from class
                classObj.totalStudents = classObj.totalStudents
                  ? classObj.totalStudents - 1
                  : 0; // Decrement totalStudents count
              }
              // Remove the classNumber from userData if it exists
              user.classNumber = user.classNumber.filter(
                (num) => num !== classNumber
              );
              console.log(
                "user.classnumber at remove classnum ==> ",
                user.classNumber
              );
              userData.classNumber = user.classNumber;
              console.log(
                "userData.classnumber at remove classnum ==> ",
                user.classNumber
              );
            } else {
              errors.push(
                `User with ID ${userId} is not enrolled in class ${classNumber}`
              );
              return res.status(400).json({
                message: `User with ID ${userId} is not enrolled in class ${classNumber}`,
              });
            }
            await classObj.save();
          }
        }
        for (const classNumber of addToClasses) {
          const classObj = await Class.findOne({ classNumber });
          console.log("class obj:===> ", classObj);
          if (classObj) {
            console.log(
              `Total Students before adding to class ${classNumber}: ${classObj.totalStudents}`
            );

            if (role === "teacher") {
              // Check if the teacher is not already assigned to the class
              if (!classObj.teachers.includes(userId)) {
                classObj.teachers.addToSet(userId); // Add teacher to class
                classObj.totalTeachers = classObj.totalTeachers
                  ? classObj.totalTeachers + 1
                  : 1; // Increment totalTeachers count
              }
            } else if (role === "student") {
              // // Check if the student is already enrolled in another class
              // const existingClass = user.classNumber && user.classNumber[0];
              // console.log("existing class===>: ", existingClass)
              // if (existingClass) {
              //     errors.push("Students can only be enrolled in one class at a time.");
              //     return res.status(400).json({message: "Students can only be enrolled in one class at a time."})
              //     break; // Exit loop if an existing class is found
              // }

              // Check if the student is not already assigned to the class (only proceed if not enrolled elsewhere)
              if (!classObj.students.includes(userId)) {
                classObj.students.addToSet(userId); // Add student to class
                console.log("userid at add student ", userId);
                classObj.totalStudents = classObj.totalStudents
                  ? classObj.totalStudents + 1
                  : 1; // Increment totalStudents count
              }
            }
            await classObj.save();
            console.log(
              `Total Students after adding to class ${classNumber}: ${classObj.totalStudents}`
            );

            // Update the classNumber in userData
            userData.classNumber = [
              ...new Set([...(userData.classNumber || []), ...addToClasses]),
            ]; // Ensures unique class numbers
            console.log("classNumber:", classNumber);
            console.log("data:", userData);
          }
        }
      }

      // Update the user data in the database
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { ...userData, updatedAt: currentDate }, // Include updatedAt field with current date
        { new: true, select: "-password" }
      );
      console.log("userdata after update ==>", userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Exclude password from the response
      const userResponse = { ...updatedUser.toObject(), password: undefined };
      res.status(200).json({ message: "User updated successfully" });
    }
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

    // console.log("found user", userToSend);
    res.status(200).json({ message: "user found:", data: userToSend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const updateUser = async (req, res) => {
//   try {
//     const userId = req.body._id;
//     const userData = req.body; // Updated data
//     delete userData.password;

//     if (!userId) {
//       return res.status(400).json("Please provide userId");
//     }

//     // Ensure classNumber is always treated as an array
//     let classNumbers = req.body.classNumber;

//     if (!Array.isArray(classNumbers)) {
//       classNumbers = [classNumbers];
//     }

//     // Validate classNumber
//     const errors = [];
//     const validClassNumbers = [];

//     for (const classNumber of classNumbers) {
//       console.log(classNumber)
//       const num = parseInt(classNumber);
//       if (isNaN(num) || num < 1 || num > 12) {
//         errors.push("Class number must be a number between 1 and 12.");
//       } else {
//         // Check if class exists
//         const classObj = await Class.findOne({ classNumber });
//         if (!classObj) {
//           errors.push(`Class with classNumber ${classNumber} not found.`);
//         } else {
//           validClassNumbers.push(classNumber);
//         }
//       }
//     }

//     if (errors.length > 0) {
//       return res.status(400).json({ message: errors.join(" ") });
//     }

//     // Validate other fields only if they are included in the update request
//     const { fullName, contact, DOB, email } = req.body;

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
//     const fullNameErrors =
//       fullName !== undefined ? validateFullName(fullName) : [];
//     const contactErrors = contact !== undefined ? validateContact(contact) : [];
//     const DOBErrors = DOB !== undefined ? validateDOB(DOB) : [];

//     fullNameErrors.forEach(error => errors.push(error));
//     contactErrors.forEach(error => errors.push(error));
//     DOBErrors.forEach(error => errors.push(error));

//     if (errors.length > 0) {
//       return res.status(400).json({ message: errors.join(" ") });
//     }

//     // Store the current date for updating the updatedAt field
//     const currentDate = new Date();

//     // Find the user to update
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Fetch user's role
//     const role = user.role;

//     // Declare newClasses and initialize it with an empty array
//     let newClasses = [];

//     // Get the new classes for the valid classNumbers
//     for (const newClassNumber of validClassNumbers) {
//       const newClass = await Class.findOne({ classNumber: newClassNumber });
//       newClasses.push(newClass);
//     }

//     // Handle class assignment
//     if (newClasses.length > 0) {
//        // Remove user from old classes
//        for (const oldClassNumber of user.classNumber) {
//         const oldClass = await Class.findOne({ classNumber: oldClassNumber });
//         if (oldClass) {
//           console.log(`Total teachers before decrement: ${oldClass.totalTeachers}`);

//           if (role === "teacher") {
//             oldClass.teachers.pull(userId); // Remove teacher from old class
//             oldClass.totalTeachers = oldClass.totalTeachers
//               ? oldClass.totalTeachers - 1
//               : 0; // Decrement totalTeachers count
//               console.log(`Total teachers after removing: ${oldClass.totalTeachers}`);

//           } else if (role === "student") {
//             oldClass.students.pull(userId); // Remove student from old class
//             oldClass.totalStudents = oldClass.totalStudents
//               ? oldClass.totalStudents - 1
//               : 0; // Decrement totalStudents count
//           }
//           await oldClass.save();
//         }
//       }

//       // Add user to new classes
//       for (const newClass of newClasses) {
//         if (role === "teacher") {
//           newClass.teachers.addToSet(userId); // Add teacher to new class
//           newClass.totalTeachers = newClass.totalTeachers
//             ? newClass.totalTeachers + 1
//             : 1; // Increment totalTeachers count
//         } else if (role === "student") {
//           newClass.students.addToSet(userId); // Add student to new class
//           newClass.totalStudents = newClass.totalStudents
//             ? newClass.totalStudents + 1
//             : 1; // Increment totalStudents count
//         }
//         await newClass.save();
//       }

//       // Update the user's classNumber
//       userData.classNumber = validClassNumbers;
//     }

//     // Update the user data in the database
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { ...userData, updatedAt: currentDate }, // Include updatedAt field with current date
//       { new: true, select: "-password" }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Exclude password from the response
//     const userResponse = { ...updatedUser.toObject(), password: undefined };
//     res.status(200).json({ message: "User updated successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

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
