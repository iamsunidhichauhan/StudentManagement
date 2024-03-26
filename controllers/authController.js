//  signupStudent, 
//  signupTeacher
//  signupUser,  
//  loginUser,
//  resetPassword, 

const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const OTP = require("../models/otp");
const Class = require("../models/class") 
const secretKey = "secret_key";
const{validateFullName, validateEmail, validateContact, validateDOB, validatePassword, validateRegistration} = require(`../validations/validator`)


// //transporter object
const transporter = nodemailer.createTransport({
  // host: 'smtp.gmail.com',
  // port: 578,   
  // secure: false,
  service: "gmail",
  auth: {
    user: 'sunidhii2701@gmail.com',
    pass: 'zfoe hwmv sxcd xbjv'
  },
});


const createClass = async (req, res) => {
  const { classNumber } = req.body;
  try {
    if (!classNumber || isNaN(classNumber) || classNumber<1 || classNumber>12) {
      return res.status(400) .json({ error: 'classNumber must be a number between 1 and 12' });
    }

    const newClass = new Class({ 
      classNumber: parseInt(classNumber) 
    });

    // Save the new class to the database
    await newClass.save();
    res.status(200).json({ message: 'Class created successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create class.' });
  }
};



// get classmembers: 
const getClassMembers = async (req, res) => {
  try {
    const classNumber = parseInt(req.body.classNumber);
    if(!classNumber){
      res.status(404).json("classNUmber is required.")
    }
    console.log("class at getMembers: ", classNumber);

    // Fetch the corresponding student and teacher IDs based on classNumber
    const students = await User.find({ classNumber: classNumber, role: 'student' }, '_id');
    const teacher = await User.find({ classNumber: classNumber, role: 'teacher' }, '_id');
    console.log("fetch student Id:",students);
    console.log(teacher);

    // Find the existing class document
    let existingClass = await Class.findOne({ classNumber: classNumber });
    console.log("classNumber", classNumber);
    console.log("existingclass:", existingClass);

    if (!existingClass) {
      return res.status(404).json({ message: `Class ${classNumber} not found` });
    }

    // Update the existing class document with student and teacher IDs
    existingClass.students = students.map(student => student._id.toString());
    existingClass.teacher = teacher.map(teacher => teacher._id.toString()); // if multiple teacher
    // existingClass.teacher = teacher[0]._id.toString(); //if one teacher 


    // total number of students studying in the class
    const totalStudents = students.length;

    // Save the updated class document
    await existingClass.save();

    // Send the response with total number of students
    res.status(200).json({ 
      message: 'Class members fetched sucessfully.', 
      class: existingClass,
      totalStudents: totalStudents // Sending total number of students with the response
    });

    // Update total number of students in the database
    existingClass.totalStudents = totalStudents;
    await existingClass.save();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching class members.' });
  }
};









// register student: 
const registerStudent = async (req, res) => {
  try {
      const { fullName, email, contact, DOB, password, confirmPassword, classNumber } = req.body;
      const role = "student";

      // Check if the email already exists
      const existingUser = await User.findOne({ email }).select('-password');
      if (existingUser) {
          return res.status(400).json({ message: "Email already exists! Please check." });
      }

      let errors = [];

      // Convert single classNumber to an array if provided
      let classNumbers = classNumber;
      if (!Array.isArray(classNumber)) {
        classNumbers = [classNumber];
      }
  
      // Validate classNumber
      if (!classNumbers) {
        errors.push('classNumber is required');
      } else {
        for (const num of classNumbers) {
          if (isNaN(num) || num < 1 || num > 12) {
            errors.push('classNumber must be a number between 1 and 12');
            break;
          }
        }
      }
      // Validate registration fields
      const validationErrors = validateRegistration(req);
      errors = errors.concat(validationErrors); // Concatenate validation errors

      // If there are any errors, return them
      if (errors.length > 0) {
          return res.status(400).json({ message: errors.join(" ") });
      }


      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user object
      const newUser = new User({
          regDate: new Date(),
          fullName: fullName,
          password: hashedPassword,
          email: email,
          contact: contact,
          DOB: DOB,
          role: role,
          classNumber: classNumber
      });

      // Save the new user
      await newUser.save();

      // Create a user object without the password field
      const userWithoutPassword = { ...newUser.toObject() };
      delete userWithoutPassword.password;

      res.status(201).json(userWithoutPassword);
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


// register teacher
const registerTeacher= async (req, res) => {
  try {
      const { fullName, email, contact, DOB, password, confirmPassword, classNumber } = req.body;
      const role = "teacher";

      // Check if the email already exists
      const existingUser = await User.findOne({ email }).select('-password');
      if (existingUser) {
          return res.status(400).json({ message: "Email already exists! Please check." });
      }

      // Initialize an array to store errors
       errors = [];

      // Convert single classNumber to an array if provided
      let classNumbers = classNumber;
      if (!Array.isArray(classNumber)) {
        classNumbers = [classNumber];
      }

      // Validate classNumber
      if (!classNumbers || !Array.isArray(classNumbers) || classNumbers.length === 0) {
          errors.push('classNumber is required and must be an array.');
      } else {
          for (const num of classNumbers) {
              if (isNaN(num) || num < 1 || num > 12) {
                  errors.push('classNumber must be a number between 1 and 12');
                  break;
              }
          }
      }

      // Validate registration fields
      const validationErrors = validateRegistration(req);
      errors = errors.concat(validationErrors); // Concatenate validation errors

      // If there are any errors, return them
      if (errors.length > 0) {
          return res.status(400).json({ message: errors.join(" ") });
      }


      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user object
      const newUser = new User({
          regDate: new Date(),
          fullName: fullName,
          password: hashedPassword,
          email: email,
          contact: contact,
          DOB: DOB,
          role: role,
          classNumber: classNumber
      });

      // Save the new user
      await newUser.save();

      // Create a user object without the password field
      const userWithoutPassword = { ...newUser.toObject() };
      delete userWithoutPassword.password;

      res.status(201).json(userWithoutPassword);
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


// registerUser controller
const registerUser = async (req, res) => {
    try {
      const { fullName, email, contact, DOB, password } = req.body;

      // Check if the requesting user is a superadmin
      if (!req.user || req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmins can create admins." });
      }
  
      // Validate registration data
      const validationErrors = validateRegistration(req);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: validationErrors.join(" ") });
      }
  
      // Check if the email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists. Please check." });
      }
  
      // Set the role to "admin"
      const role = "admin";
      const regDate = new Date();
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const newUser = new User({
        regDate,
        fullName,
        password: hashedPassword,
        email,
        contact,
        DOB,
        role,
      });
      await newUser.save();
  
      // Exclude the password from the response
      const newUserResponse = { ...newUser.toObject(), password: undefined, classNumber:undefined };
      delete newUserResponse.classNumber;

      res.status(201).json(newUserResponse);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
};

// login
const loginUser = async (req, res) => {
  try {
      const { email, password } = req.body;
      const newUser = await User.findOne({ email });
      if (!newUser) {
          return res.status(400).json({ message: "User not registered." });
      }
      const isAuthenticated = await bcrypt.compare(password, newUser.password);
      if (!isAuthenticated) {
          return res.status(400).json({ message: "Invalid username or password." });
      } else {
          // Token generation:
          const token = jwt.sign({ userId: newUser._id, email: newUser.email, role: newUser.role }, secretKey, { expiresIn: '24h' });
          
          // Create user object without password
          const userWithoutPassword = {
              _id: newUser._id,
              fullName: newUser.fullName,
              email: newUser.email,
              contact: newUser.contact,
              DOB: newUser.DOB,
              role: newUser.role,
              token: token
          };
          // Return user object without password and with token
          res.status(200).json({ message: "Logged in!", user: userWithoutPassword });
          console.log(userWithoutPassword);
          newUser.token = token;
          await newUser.save();
      }
  } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
  }
};





// reset Password
const resetPassword = async (req, res) => {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body;
      const errors = [];

      const user = await User.findOne({ email }).select('-password');;
      if (!user) {
        return res.status(404).json({ message: 'User with this email does not exist' });
      }  

      errors.push(...validatePassword(newPassword));
      if(!otp){
        errors.push("otp required.")
      }
      if (!confirmPassword) {
        errors.push("Confirm password is required.");
    } else if (newPassword !== confirmPassword) {
        errors.push("Passwords do not match.");
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }        
      const otpRecord = await OTP.findOne({ email, otp });
      if (!otpRecord || otpRecord.expiry < Date.now()) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
      }      
      const hashedPassword = await bcrypt.hash(newPassword, 10);                                            
    
      // Update password
      await user.save();
    
      // Delete OTP record
      await OTP.deleteOne({ email, otp });
      delete user.password;
    
      res.status(200).json({ message: 'Password reset successfully', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
};






// forgotpassword
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }
        const existingOTPrecord = OTP.findOne({email})
      if  (existingOTPrecord){
          await existingOTPrecord.deleteOne();
      }
      
      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpExpiry = new Date(Date.now() + 60000); 
      
      // Save OTP in the OTP collection
      const newOTP = new OTP({
        email: email,
        otp: otp,
        expiry: otpExpiry
      });
      await newOTP.save();
      console.log(newOTP)
      
      // Send the OTP to the user's email using nodemailer
      const mailOptions = {
        from: 'sunidhii2701@gmail.com',
        to: email,
        subject: 'Password Reset OTP',
        text: `Here is your OTP for password reset: ${otp}`
      };
      console.log(mailOptions)
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({ message: 'Error sending email', error: error.message});
        }  
        res.status(200).json({ message: 'OTP sent to your email' });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {registerStudent, registerUser,  loginUser,resetPassword, registerTeacher, forgotPassword, createClass,getClassMembers };