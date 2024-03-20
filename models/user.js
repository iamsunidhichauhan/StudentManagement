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
        type: String,
    },
    password:{
        type:String,
    },
    token:{
        type:String,
    }
}, {
    timestamps: true 
});

const User = mongoose.model('User', userSchema);

module.exports = User;

// registration date, fullname,email,phone no, DOB, role, password, and token.