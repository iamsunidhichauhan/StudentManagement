// for single sub single docs
// 
// const mongoose = require("mongoose");

// const marksSchema = new mongoose.Schema({
//   subject: {
//     type: String,
//     required: true,
//     trim: true,
//     // unique: true, 
//   },
//   studentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     // required: true 
//   },
//   totalMarks: {
//     type: Number,
//   },
//   obtainedMarks: [{
//     studentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true 
//     },
//     marks: {
//       type: Number,
//       required: true 
//     }
//   }], 
//   examType: {
//     type: String,
//     enum: ['quarterly ', 'halfquarterly', 'final'], 
//     required: true
//   },
// });

// const Marks = mongoose.model("Marks", marksSchema);

// module.exports = Marks;
// 


// for single subjects multiple docs 
const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalMarks: { type: Number },
  obtainedMarks: { type: Object }, 
  examType: {
    type: String,
    enum: ['quarterly', 'Halfyearly', 'final'], 
    required: true
  },
  result: {
    type: String,
    enum: ['Pass', 'Fail'], 
    required: true
  },
  percentage:{
    type: Number,
    // required: true
  },
  // result:{
  //   type: Number,
  //   required:true
  // },
});

const Marks = mongoose.model("Marks", marksSchema);

module.exports = Marks;

