const mongoose = require("mongoose");



const classSchema = new mongoose.Schema({
  classNumber: { type: Number, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teacher: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const Class = mongoose.model('Class', classSchema, 'Class');

module.exports = Class;

