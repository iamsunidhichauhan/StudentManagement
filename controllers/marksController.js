const Subject = require(`../models/subject`);
const Class = require(`../models/class`);
const User = require(`../models/user`);
const Marks = require(`../models/marks`);

const calculateOverallResult = async (studentId, examType) => {
  try {
    // Step 1: Find all marks documents associated with the student ID and the specified exam type
    const marks = await Marks.find({
      studentId,
      examType,
    });

    // Step 2: Calculate overall percentage
    let totalObtainedMarks = 0;
    let totalPossibleMarks = 0;

    // Determine the total possible marks based on the exam type
    const maxMarksPerSubject = {
      final: 100,
      halfyearly: 50,
      quarterly: 30,
    };

    // Iterate through each mark document
    for (const mark of marks) {
      totalObtainedMarks += mark.obtainedMarks;
      totalPossibleMarks += maxMarksPerSubject[examType];
    }

    console.log("totalObtainedMarks",totalObtainedMarks);
    console.log("totalPossibleMarks",totalPossibleMarks);
    
    const overallPercentage = ((totalObtainedMarks / totalPossibleMarks) * 100).toFixed(2);
    console.log("overall percentage: ",overallPercentage)

    // Step 3: Determine overall result
    let overallResult;
    if (overallPercentage >= 35) {
      overallResult = "Pass";
    } else {
      overallResult = "Fail";
    }

    return { overallPercentage, overallResult };
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  }
};


// const updateExamsField = async (
//   studentId,
//   marksId,
//   overallPercentage,
//   overallResult,
//   examType
// ) => {
//   try {
//     // Retrieve user details
//     const user = await User.findById(studentId);

//     if (!user || user.role !== "student") {
//       throw new Error("Invalid student");
//     }

//     // Check if the user already has an exam entry for the given examType
//     const examIndex = user.exams.findIndex(
//       (exam) => exam.examType === examType
//     );

//     // Update exams array
//     if (examIndex !== -1) {
//       // Update existing exam entry
//       user.exams[examIndex].marksIds.push(marksId);
//       user.exams[examIndex].overallPercentage = overallPercentage;
//       user.exams[examIndex].overallResult = overallResult;
//     } else {
//       // Create new exam entry
//       user.exams.push({
//         examType,
//         marksIds: [marksId],
//         overallPercentage,
//         overallResult,
//       });
//     }

//     // Save updated user document
//     await user.save();
//   } catch (error) {
//     console.error("An error occurred:", error);
//     throw error;
//   }
// };



const updateExamsField = async (
  studentId,
  marksId,
  overallPercentage,
  overallResult,
  examType
) => {
  try {
    // Retrieve user details
    const user = await User.findById(studentId);

    if (!user || user.role !== "student") {
      throw new Error("Invalid student");
    }

    // Check if the user already has an exam entry for the given examType
    const examIndex = user.exams.findIndex(
      (exam) => exam.examType === examType
    );

    // Update exams array
    if (examIndex !== -1) {
      // Check if the marksId already exists in the marksIds array for this exam type
      const marksExistsIndex = user.exams[examIndex].marksIds.indexOf(marksId);
      if (marksExistsIndex === -1) {
        // If the marks ID does not exist, push it to the marksIds array
        user.exams[examIndex].marksIds.push(marksId);
      }
      // Update overallPercentage and overallResult
      user.exams[examIndex].overallPercentage = overallPercentage;
      user.exams[examIndex].overallResult = overallResult;
    } else {
      // Create new exam entry
      user.exams.push({
        examType,
        marksIds: [marksId],
        overallPercentage,
        overallResult,
      });
    }

    // Save updated user document
    await user.save();
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  }
};


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

    // *** notification for remaining subjects : 
    // Get all subjects for the student
    const studentSubjects = user.subjects;
    // Filter subjects with missing marks entries (using promises for clarity)
    const missingSubjects = await Promise.all(
      studentSubjects.map(async (subjectName) => {
        const existingMarks = await Marks.findOne({
          subject: subjectName,
          studentId,
          examType: "final",
        });
        return !existingMarks ? subjectName : null; // Include only missing subjects
      })
    );
    // Filter out null values (subjects with existing marks)
    const actualMissingSubjects = missingSubjects.filter((subject) => subject);
    // Prepare notification message (if any)
    let Note;
    if (actualMissingSubjects.length > 0) {
      const missingSubjectsList = actualMissingSubjects.join(", ");
      Note = `Marks entry remaining for ${missingSubjectsList} subjects.`;
    }

    // Calculate overall result for the final exam
    const { overallPercentage, overallResult } = await calculateOverallResult(
      studentId,
      "final"
    );

    // Update exams field in the user document
    await updateExamsField(
      studentId,
      marks._id,
      overallPercentage,
      overallResult,
      "final"
    );
    // Return marks document along with overall result
    return res
      .status(201)
      .json({ marks, overallPercentage, overallResult, Note });
  } catch (error) {
    console.error("An error occurred:", error);
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
      examType: "halfyearly",
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

    // Create and save marks document
    const marks = new Marks({
      subject: subjectName,
      studentId,
      totalMarks: 50,
      obtainedMarks,
      result: obtainedMarks >= 20 ? "Pass" : "Fail",
      examType: "halfyearly",
    });
    await marks.save();

    // *** notification for remaining subjects : 
    // Get all subjects for the student
    const studentSubjects = user.subjects;
    // Filter subjects with missing marks entries (using promises for clarity)
    const missingSubjects = await Promise.all(
      studentSubjects.map(async (subjectName) => {
        const existingMarks = await Marks.findOne({
          subject: subjectName,
          studentId,
          examType: "halfyearly",
        });
        return !existingMarks ? subjectName : null; // Include only missing subjects
      })
    );
    // Filter out null values (subjects with existing marks)
    const actualMissingSubjects = missingSubjects.filter((subject) => subject);
    // Prepare notification message (if any)
    let Note;
    if (actualMissingSubjects.length > 0) {
      const missingSubjectsList = actualMissingSubjects.join(", ");
      Note = `Marks entry remaining for ${missingSubjectsList} subjects.`;
    }

    // Calculate overall result
    const { overallPercentage, overallResult } = await calculateOverallResult(
      studentId,
      "halfyearly"
    );

    // Update exams field in the user document
    await updateExamsField(
      studentId,
      marks._id,
      overallPercentage,
      overallResult,
      "halfyearly"
    );
    // Return marks document along with overall result
    return res
      .status(201)
      .json({ marks, overallPercentage, overallResult, Note });
  } catch (error) {
    console.error("An error occurred:", error);
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

    // Create and save marks document
    const marks = new Marks({
      subject: subjectName,
      studentId,
      totalMarks: 30,
      obtainedMarks,
      result: obtainedMarks >= 10 ? "Pass" : "Fail",
      examType: "quarterly",
    });
    await marks.save();

    // *** notification for remaining subjects : 
    // Get all subjects for the student
    const studentSubjects = user.subjects;
    // Filter subjects with missing marks entries (using promises for clarity)
    const missingSubjects = await Promise.all(
      studentSubjects.map(async (subjectName) => {
        const existingMarks = await Marks.findOne({
          subject: subjectName,
          studentId,
          examType: "quarterly",
        });
        return !existingMarks ? subjectName : null; // Include only missing subjects
      })
    );
    // Filter out null values (subjects with existing marks)
    const actualMissingSubjects = missingSubjects.filter((subject) => subject);
    // Prepare notification message (if any)
    let Note;
    if (actualMissingSubjects.length > 0) {
      const missingSubjectsList = actualMissingSubjects.join(", ");
      Note = `Marks entry remaining for ${missingSubjectsList} subjects.`;
    }

    // Calculate overall result
    const { overallPercentage, overallResult } = await calculateOverallResult(
      studentId,
      "quarterly"
    );

    // Update exams field in the user document
    await updateExamsField(
      studentId,
      marks._id,
      overallPercentage,
      overallResult,
      "quarterly"
    );
    // Return marks document along with overall result
    return res
      .status(201)
      .json({ marks, overallPercentage, overallResult, Note });
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({ error: error.message });
  }
};

const findMarksById = async (req, res) => {
  try {
    const { marksId } = req.body;

    // Find the marks document with the specified ID
    const marks = await Marks.findById(marksId);

    // Check if the document is found
    if (!marks) {
      return res.status(404).json({ error: "Marks document not found" });
    }

    // Return the found marks document
    return res.status(200).json(marks);
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getMarksList = async (req, res) => {
  try {
    // Find all marks documents
    const marks = await Marks.find();

    // Return the list of marks
    return res.status(200).json(marks);
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({ error: error.message });
  }
};

const updateMarks = async (req, res) => {
  const { subjectName, studentId, obtainedMarks, examType } = req.body;

  // Check if all fields are present
  if (!subjectName || !studentId || !obtainedMarks || !examType) {
    return res.status(400).json({ error: "All fields are mandatory" });
  }

  try {
    // Validate studentId
    const user = await User.findById(studentId);
    if (!user || user.role !== "student") {
      return res.status(400).json({ error: "Invalid student" });
    }

    // Find the existing marks entry
    const marksEntry = await Marks.findOne({
      subject: subjectName,
      studentId,
      examType,
    });

    if (!marksEntry) {
      return res.status(404).json({ error: "Marks entry not found" });
    }

    // Update obtained marks and result
    marksEntry.obtainedMarks = obtainedMarks;
    marksEntry.result = obtainedMarks >= 35 ? "Pass" : "Fail";

    // Save the changes to the database
    await marksEntry.save();

    // Recalculate overall results
    const { overallPercentage, overallResult } = await calculateOverallResult(studentId, examType);

    // Update user's exams field with new overall results
    await updateExamsField(studentId, marksEntry._id, overallPercentage, overallResult, examType);

    return res
      .status(200)
      .json({ message: "Marks updated successfully", marksEntry });
  } catch (error) {
    console.error("an error occurred:", error);
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
  findMarksById,
  getMarksList,
  updateMarks,
  deleteMarks,
};
