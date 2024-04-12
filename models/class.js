const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  classNumber: { type: Number, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // subjects:[{type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  subjects:[{type: String}],
  totalStudents: { type: Number , 
    // default:0 
  },
  totalTeachers: { type: Number, 
    // default: 0
   },
  
});

const Class = mongoose.model('Class', classSchema, 'Class');
module.exports = Class;