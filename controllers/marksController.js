const Subject = require(`../models/subject`);
const Class = require(`../models/class`);
const User = require(`../models/user`);
const Marks = require(`../models/marks`);

// const createFinalMarks = async (req, res) => {
//   const { subjectName, studentId, obtainedMarks } = req.body;

//   try {
//     // Check if the subject exists
//     let subject = await Subject.findOne({ subject: subjectName });
//     if (!subject) {
//       return res.status(404).json({ error: "Subject not found" });
//     }

//     // Retrieve user details and check if user is a student
//     const user = await User.findById(studentId);
//     if (!user || user.role !== "student") {
//       return res.status(400).json({ error: "Invalid student" });
//     }

//     // Check if the subject is present in the student's subjects array
//     if (!user.subjects.includes(subjectName)) {
//       return res.status(400).json({ error: "Student is not studying the subject" });
//     }

//     // Determine total marks (100 for final exam)
//     const totalMarks = 100;

//     // Ensure obtained marks do not exceed total marks
//     if (obtainedMarks > totalMarks) {
//       return res.status(400).json({ error: "Obtained marks cannot exceed total marks" });
//     }

//     // Find marks entry for the subject
//     let marks = await Marks.findOne({ subject: subjectName });

//     // If marks entry doesn't exist, create a new one
//     if (!marks) {
//       marks = new Marks({ subject: subjectName, totalMarks, examType: 'final' });
//     }

//     // Push the new student ID and obtained marks
//     marks.obtainedMarks.push({ studentId, marks: obtainedMarks });

//     // Save marks entry
//     await marks.save();

//     return res.status(201).json(marks);
//   } catch (error) {
//     console.error("an error accured :", error);
//     return res.status(500).json({ error: error.message });
//   }
// };
//

const createFinalMarks = async (req, res) => {
  const { subjectName, studentId, obtainedMarks } = req.body;

  try {
    // Check if marks entry already exists for the same subject, studentId, and examType
    const existingMarks = await Marks.findOne({
      subject: subjectName,
      studentId,
      examType: "final",  
    });
    if (existingMarks) {
      return res.status(400).json({
        error:
          "Marks entry already exists for the student in this subject and exam type",
      });
    }

    // Retrieve user details and check if user is a student
    const user = await User.findById(studentId);
    if (!user || user.role !== "student") {
      return res.status(400).json({ error: "Invalid student" });
    }

    // Check if the subject exists
    const subject = await Subject.findOne({ subject: subjectName });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Check if the subject is present in the student's subjects array
    if (!user.subjects.includes(subjectName)) {
      return res
        .status(400)
        .json({ error: "Student is not studying the subject" });
    }

    // Determine total marks (100 for final exam)
    const totalMarks = 100;

    // Ensure obtained marks do not exceed total marks
    if (obtainedMarks > totalMarks) {
      return res
        .status(400)
        .json({ error: "Obtained marks cannot exceed total marks" });
    }

    // Create and save marks document
    const marks = new Marks({
      subject: subjectName,
      studentId,
      totalMarks: 100, 
      obtainedMarks,
      result: obtainedMarks >= 35 ? "Pass" : "Fail",
      examType: "final",
    });
    await marks.save();

    // Update user with reference to the created marks document 
    user.marks.push(marks._id); // Push the ObjectId of the created marks document
    await user.save();

    return res.status(201).json(marks);
  } catch (error) {
    console.error("an error accured:", error);
    return res.status(500).json({ error: error.message });
  }
};






const createHalfyearlyMarks = async (req, res) => {
  const { subjectName, studentId, obtainedMarks } = req.body;

  try {
    // Check if marks entry already exists for the same subject, studentId, and examType
    const existingMarks = await Marks.findOne({
      subject: subjectName,
      studentId,
      examType: "Halfyearly",
    });
    if (existingMarks) {
      return res.status(400).json({
        error:
          "Marks entry already exists for the student in this subject and exam type",
      });
    }

    // Retrieve user details and check if user is a student
    const user = await User.findById(studentId);
    if (!user || user.role !== "student") {
      return res.status(400).json({ error: "Invalid student" });
    }

    // Check if the subject exists
    const subject = await Subject.findOne({ subject: subjectName });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Check if the subject is present in the student's subjects array
    if (!user.subjects.includes(subjectName)) {
      return res
        .status(400)
        .json({ error: "Student is not studying the subject" });
    }

    // Determine total marks (100 for final exam)
    const totalMarks = 50;

    // Ensure obtained marks do not exceed total marks
    if (obtainedMarks > totalMarks) {
      return res
        .status(400)
        .json({ error: "Obtained marks cannot exceed total marks" });
    }
    // Calculate marks details (unchanged)
    const percentage = (obtainedMarks / totalMarks) * 100;
    const result = obtainedMarks >= 20 ? "Pass" : "Fail";

    // Create and save marks document
    const marks = new Marks({
      subject: subjectName,
      studentId,
      totalMarks: 50, 
      obtainedMarks,
      percentage: (obtainedMarks / 50) * 100,
      result: obtainedMarks >= 20 ? "Pass" : "Fail",
      examType: "Halfyearly",
    });
    await marks.save();

    // Update user with reference to the created marks document 
    user.marks.push(marks._id); // Push the ObjectId of the created marks document
    await user.save();

    return res.status(201).json(marks);
  } catch (error) {
    console.error("an error accured:", error);
    return res.status(500).json({ error: error.message });
  }
};

const createQuaterlymarks = async (req, res) => {
  const { subjectName, studentId, obtainedMarks } = req.body;

  try {
    // Check if marks entry already exists for the same subject, studentId, and examType
    const existingMarks = await Marks.findOne({
      subject: subjectName,
      studentId,
      examType: "quarterly",
    });
    if (existingMarks) {
      return res.status(400).json({
        error:
          "Marks entry already exists for the student in this subject and exam type",
      });
    }

    // Retrieve user details and check if user is a student
    const user = await User.findById(studentId);
    if (!user || user.role !== "student") {
      return res.status(400).json({ error: "Invalid student" });
    }

    // Check if the subject exists
    const subject = await Subject.findOne({ subject: subjectName });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Check if the subject is present in the student's subjects array
    if (!user.subjects.includes(subjectName)) {
      return res
        .status(400)
        .json({ error: "Student is not studying the subject" });
    }

    // Determine total marks (100 for final exam)
    const totalMarks = 30;

    // Ensure obtained marks do not exceed total marks
    if (obtainedMarks > totalMarks) {
      return res
        .status(400)
        .json({ error: "Obtained marks cannot exceed total marks" });
    }
    // Calculate marks details (unchanged)
    const percentage = (obtainedMarks / totalMarks) * 100;
    const result = obtainedMarks >= 15 ? "Pass" : "Fail";

    // Create and save marks document
    const marks = new Marks({
      subject: subjectName,
      studentId,
      totalMarks: 30, 
      obtainedMarks,
      percentage: (obtainedMarks / 30) * 100,
      result: obtainedMarks >= 15 ? "Pass" : "Fail",
      examType: "Halfyearly",
    });
    await marks.save();

    // Update user with reference to the created marks document 
    user.marks.push(marks._id); // Push the ObjectId of the created marks document
    await user.save();

    return res.status(201).json(marks);
  } catch (error) {
    console.error("an error accured:", error);
    return res.status(500).json({ error: error.message });
  }
};

const findMarksByStudentIdAndMarksId = async (req, res) => {
  const { studentId, marksId } = req.query;

  try {
    // Check if all fields are blank or not present
    if (!studentId && !marksId) {
      // Find all marks entries
      const marks = await Marks.find();
      return res.status(200).json(marks);
    }

    let studentIds = Array.isArray(studentId)
      ? studentId
      : studentId
      ? [studentId]
      : [];
    const marksIds = marksId
      ? Array.isArray(marksId)
        ? marksId
        : [marksId]
      : [];

    // Find marks entries by studentId and marksId
    const query = {
      $or: [{ studentId: { $in: studentIds } }, { _id: { $in: marksIds } }],
    };

    const marks = await Marks.find(query);

    return res.status(200).json(marks);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateMarks = async (req, res) => {
  const { subjectName, studentId, obtainedMarks } = req.body;

  // Check if all fields are present
  if (!subjectName || !studentId || !obtainedMarks) {
    return res.status(400).json({ error: "All fields are mandatory" });
  }

  try {
    // Validate studentId
    const user = await User.findById(studentId);
    if (!user || user.role !== "student") {
      return res.status(400).json({ error: "Invalid student" });
    }

    // Validate subjectName
    const marksEntry = await Marks.findOne({ subject: subjectName, studentId });
    if (!marksEntry) {
      return res.status(404).json({ error: "Marks entry not found" });
    }

    // Update obtained marks for the specified subject and student
    marksEntry.obtainedMarks = obtainedMarks;

    // Save the changes to the database immediately
    await marksEntry.save();

    return res
      .status(200)
      .json({ message: "Marks updated successfully", marksEntry });
  } catch (error) {
    console.error("an error accured:", error);
    return res.status(500).json({ error: error.message });
  }
};

const deleteMarks = async (req, res) => {
  const marksId = req.body._id;

  console.log("marksId", marksId);

  try {
    // Delete the class record
    const deletedmarksDoc = await Marks.findByIdAndDelete(marksId);
    console.log("Marks id is:", marksId);

    if (!deletedmarksDoc) {
      return res.status(404).json({ message: "Marks doc not found" });
    }

    res.status(200).json({ message: "marks doc deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuaterlymarks,
  createHalfyearlyMarks,
  createFinalMarks,
  findMarksByStudentIdAndMarksId,
  updateMarks,
  deleteMarks,
};
