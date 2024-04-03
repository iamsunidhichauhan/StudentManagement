const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  classNumber: { type: Number, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Changed from 'teacher' to 'teachers'
  classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalStudents: { type: Number },
  totalTeachers: { type: Number }
});

const Class = mongoose.model('Class', classSchema, 'Class');
module.exports = Class;