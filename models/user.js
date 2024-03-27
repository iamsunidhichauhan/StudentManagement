const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    regDate: {
        type: Date,
    },
    fullName: {
        type: String,
    },
    email: {
        type: String,
    },
    contact: {
        type: String,
    },
    DOB: {
        type: Date,
    },
    role: {
        type: String, // either teacher or student or admin
    },
    password:{
        type:String,
    },
    classNumber:{
        type:[Number]
    },
    token:{
        type:String,
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
});

const User = mongoose.model('user', userSchema);

module.exports = User;
