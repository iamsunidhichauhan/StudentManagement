const express = require("express");
const app = express();
const mongoose = require("mongoose");

// Middleware
app.use(express.json());

// Import models
const User = require("./models/user");
const OTP = require("./models/otp");
const Class = require("./models/class");
const subjects = require("./models/subject")

// Import controllers
const {
  getAllUsersbyGet,
  getAllUsersbyPost,
  updateRole,
  getOneUser,
  updateUser,
  deleteUser,
  getStudents,
  getTeachers,
  getMyDetails,
} = require("./controllers/userController");

const {
  registerStudent,
  registerUser,
  loginUser,
  resetPassword,
  registerTeacher,
  forgotPassword,
  getClassMembers,
} = require(`./controllers/authController`);
const { isAdmin, verifyToken } = require(`./middlewares/middleware`);

const{findOneClass,  
  getAllClass,
  createClass,
  updateClass,
  deleteClass
} = require(`./controllers/classController`)

const {createSubject,getSubject,deleteSubject,getAllSubject,updateSubject} = require(`./controllers/subjectController`)

// Routes
app.get("/", (req, res) => {
  res.send("student management");
});

// Authentication routes
app.post("/register/user", verifyToken, isAdmin, registerUser);
app.post("/login/user", loginUser);
app.post("/forgot-password", forgotPassword);
app.post("/reset-password", resetPassword);

// User routes
app.get("/users", verifyToken, isAdmin, getAllUsersbyGet);
app.post("/users", verifyToken, isAdmin, getAllUsersbyPost);
app.get("/findOne/user", verifyToken, isAdmin, getOneUser);
app.put("/update/user", verifyToken, isAdmin, updateUser);
app.delete("/delete/user", verifyToken, isAdmin, deleteUser);
app.put("/setAdmin", verifyToken, isAdmin, updateRole);

// Student and Teacher routes
app.post("/register/student", verifyToken, isAdmin, registerStudent);
app.post("/register/teacher", verifyToken, isAdmin, registerTeacher);
app.get("/students", verifyToken, isAdmin, getStudents);
app.get("/teachers", verifyToken, isAdmin, getTeachers);
app.get("/getMyDetails", verifyToken, getMyDetails);

// classrouts
app.post("/create-class", createClass);
app.post("/classMembers", getClassMembers);
app.get(`/get-all-class`, getAllClass);
app.get("/find_Class", findOneClass);
app.post("/update_class", updateClass);
app.post("/delete_class", deleteClass)

// subject routs: 
app.post("/create_subjects", createSubject)
app.get("/get_subjects",getSubject )
app.post("/delete_subject", deleteSubject)
app.get(`/getAllSubject`, getAllSubject)
app.post("/update_subject",updateSubject)

// Connect to MongoDB and start the server
mongoose
  .connect("mongodb://localhost:27017/student_management")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
