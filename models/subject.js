const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({

    classId: {type: mongoose.Schema.Types.ObjectId, ref: "Class"},
    classNumber:{type:Number, required: true},
    subjects:[{type: String, required: true}]
})

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject
