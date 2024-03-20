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
    timestamps: { createdAt: true, updatedAt: false }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
