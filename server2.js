const express = require ("express");
const app = express();
const mongoose = require ("mongoose");
const User = require (`./models/user`);
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const secretKey = "secret_key";
const nodemailer = require("nodemailer");
const OTP = require('./models/otp');


// use middleware to parse JSON
app.use(express.json());
// check if the server is running
app.get(`/`,(req,res)=>{
    res.send("student management");
});
// verify admin
const isAdmin = (req, res, next) => {
    const { role } = req.user;
    console.log("========>")
    console.log("role at isAdmin func",role)
    if (role !== 'admin' && role !== "superadmin") {
        return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }    
    next();
};

// verify Token
function verifyToken(req, res, next) {
    let token = req.headers.authorization; 
    console.log(token);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized! Token not provided." });
    }
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      req.user = decoded;
      console.log("decoded user : ", req.user);
      
      next();
    });
};


const validateFullName = (fullName) => {
    const errors = [];
    if (!fullName) {
        errors.push("Full name is required.");
    } else {
        const trimmedFullName = fullName.trim();
        // const nameRegex = /^( ?[a-zA-Z]+ ?)+$/;
        const nameRegex = /^( ?[a-zA-Z]{3,50} ?)+$/;

        if (!nameRegex.test(trimmedFullName)) {
            errors.push('Please enter your full name (only letters and spaces).');
        }
    }
    return errors;
};

const validateEmail = (email) => {
    const errors = [];
    if (!email) {
        errors.push("Email is required.");
    } else {
        const emailRegex = /^\s*[a-z0-9]+@[a-z]+\.[a-z]{2,3}\s*$/;
        if (!emailRegex.test(email)) {
            errors.push('Please enter a valid email.');
        }
    }
    return errors;
};

const validateContact = (contact) => {
    const errors = [];
    if (!contact) {
        errors.push("Contact is required.");
    } else {
        const contactRegex = /^\d{10}$/;
        if (!contactRegex.test(contact)) {
            errors.push('Please enter a valid contact.');
        }
    }
    return errors;
};

const validateDOB = (DOB) => {
    const errors = [];
    if (!DOB) {
        errors.push("DOB is required.");
    } else {
        const dateParts = DOB.split('-');
        if (dateParts.length !== 3 || dateParts[0].length !== 4 || dateParts[1].length !== 2 || dateParts[2].length !== 2) {
            errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
        } else {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const day = parseInt(dateParts[2], 10);
            if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
                errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
            } else if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) {
                errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
            } else if (month === 2) {
                const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                if ((isLeapYear && day > 29) || (!isLeapYear && day > 28)) {
                    errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
                }
            }
        }
    }
    return errors;
};

const validatePassword = (password) => {
    const errors = [];
    if (!password) {
        errors.push("Password is required.");
    } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-+_!@#$%^&*.,?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            errors.push('Password must contain at least one uppercase letter, one lowercase letter, one digit, and be at least 8 characters long.');
        }
    }
    return errors;
};


const validateRegistration = (req) => {
    const { fullName, email, contact, DOB, password, confirmPassword } = req.body;
    const errors = [];
    
    errors.push(...validateFullName(fullName));
    errors.push(...validateEmail(email));
    errors.push(...validateContact(contact));
    errors.push(...validateDOB(DOB));
    errors.push(...validatePassword(password));
    if (!confirmPassword) {
        errors.push("Confirm password is required.");
    } else if (password !== confirmPassword) {
        errors.push("Passwords do not match.");
    }
    return errors;
};


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



app.post('/forgot-password', async (req, res) => {
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
});

app.post('/reset-password', async (req, res) => {
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
});

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

  



// findAll
app.get(`/users`, verifyToken, async (req, res) => {
    try {
        const foundUsers = await User.find({}).select('-password');
        res.status(200).json({ message: "users fetched successfully!", users: foundUsers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// findOne
app.get(`/findOne/user`, verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId; 
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
});




// registeradmin
app.post(`/register/user`, verifyToken,async (req,res)=>{
    try {      
        const{fullName,email,contact,DOB,password}= req.body;
        if (!req.user || req.user.role !== "superadmin") {
            return res.status(403).json({message: "Only superadmins can create admins."});
        }
        const validationErrors = validateRegistration(req);
        if(validationErrors.length>0){
            return res.status(400).json({message:validationErrors.join(" ")});
        };
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exist. please check." });
        }
        const role = "admin";
        const regDate = new Date();
        const hashedPassword = await bcrypt.hash(password, 10); 
        const newUser = new User({
            regDate: regDate,
            fullName: fullName,
            password : hashedPassword,
            email : email,
            contact: contact,
            DOB : DOB,
            role: role
        });
        await newUser.save(); 
        const newUserResponse = { ...newUser.toObject(), password: undefined };
        res.status(201).json(newUserResponse); 
        // delete newUser.password; //delete password from response

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message }); 
    }
});


// updateRole to admin
app.put(`/setAdmin`,verifyToken, async(req,res)=>{
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
})

// update user
app.put(`/update/user`, verifyToken, isAdmin, async (req, res) => {
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
});

// login
app.post(`/login/user`, async ( req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        console.log("data:", user);
        if (!user) {
            return res.status(400).json({ message: "User not registered." });
        }
        const isAuthenticated = await bcrypt.compare(password, user.password);
        if (!isAuthenticated) {
            return res.status(400).json({ message: "Invalid username or password. " });
        } else {
            // Token generation:
            const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, secretKey, { expiresIn: '24h' });

            const sanitizedUser = { userId: user._id, email: user.email, role: user.role }; // Create sanitized user
            res.status(200).json({ message: "Logged in!", sanitizedUser, token });

            // user.token = token;
            // // delete user.password;
            // await user.save();
            // console.log("password at login", user.password)      
            // res.status(200).json({ message: "Logged in!", user });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Get all Students
app.get(`/students`, verifyToken,isAdmin, async (req, res) => {
    try {
        const students = await User.find({ role: "student" }).select('-password');
        res.status(200).json({ message: "Students fetched successfully!", students: students });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Get all Teachers
app.get(`/teachers`, verifyToken, isAdmin, async (req, res) => {
    try {
        const teachers = await User.find({ role: "teacher" }).select('-password'); 
        res.status(200).json({ message: "Teachers fetched successfully!", teachers: teachers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// get my details
app.get(`/getMyDetails`, verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId; 
        const user = await User.findById(userId).select('-password'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: "Logged-in User Details", user: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});






// register student
app.post(`/register/student`, verifyToken,isAdmin, async (req, res) => {
    try {
        const { fullName, email, contact, DOB, password, confirmPassword } = req.body;
        const role = "student";
        console.log( "req body at reg student",req.body)
        
        const existingUser = await User.findOne({email}).select('-password');
        if(existingUser){
            return res.status(400).json({ message: "Email already exist! please check." });
        };          
        const validationErrors = validateRegistration(req);
        if (validationErrors.length > 0) {
            return res.status(400).json({ message: validationErrors.join(" ") });
        }
        const regDate = new Date();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            regDate: regDate,
            fullName: fullName,
            password: hashedPassword,
            email: email,
            contact: contact,
            DOB: DOB,
            role: role
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
});

// register teacher
app.post(`/register/student`, verifyToken,isAdmin, async (req, res) => {
    try {
        const { fullName, email, contact, DOB, password, confirmPassword } = req.body;
        const role = "teacher";
        console.log( "req body at reg student",req.body)
        
        const existingUser = await User.findOne({email}).select('-password');
        if(existingUser){
            return res.status(400).json({ message: "Email already exist! please check." });
        };          
        const validationErrors = validateRegistration(req);
        if (validationErrors.length > 0) {
            return res.status(400).json({ message: validationErrors.join(" ") });
        }
        const regDate = new Date();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            regDate: regDate,
            fullName: fullName,
            password: hashedPassword,
            email: email,
            contact: contact,
            DOB: DOB,
            role: role
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
});



// delete
app.delete(`/delete/user`,verifyToken,  async (req, res) => {
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
});

// connect to mongodb
mongoose.connect("mongodb://localhost:27017/student_management")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch(error => {
    console.error("Error connecting to MongoDB:", error);
  });

