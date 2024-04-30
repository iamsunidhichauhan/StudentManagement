const Subject = require(`../models/subject`);
const Class = require("../models/class");
const User = require(`../models/user`);
const {
  validateSubjects,
  validateUpdateSubjects,
} = require(`../validations/validator`);
const {searchSubjects} = require("../operations/searchOperations")

// CREATE
const createSubject = async (req, res) => {
  try {
    const { classNumber, subjects } = req.body;
    console.log("subjects from body : ", subjects);

    // Validate subject content
    const validationErrors = validateSubjects(subjects, classNumber);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Find the class with the given classNumber
    if (
      typeof classNumber !== "number" ||
      classNumber <= 1 ||
      classNumber >= 12
    ) {
      // return res
      //   .status(400)
      //   .json({ message: "Class number must be a number between 1 and 12." });
    }

    const classDetails = await Class.findOne({ classNumber });

    if (!classDetails) {
      return res.status(404).json({ error: "Class not found" });
    }

    // // Check if subjects have already been created for this class
    // if (classDetails.subjects.length > 0) {
    //   return res.status(400).json({ message: "Subjects already declared for this class." });
    // }

    // Create a new subject document
    const newSubject = await Subject.create({
      classId: classDetails._id,
      classNumber,
      subjects: [...new Set(subjects)], // Save only unique subjects
    });
    console.log("unique subjects:", [...new Set(subjects)]);

    // Push the new subjects into the subjects array of the corresponding Class document
    classDetails.subjects.push(...new Set(subjects)); // Push only unique subjects

    // Save the updated Class document
    await classDetails.save();
    console.log("classDetails at save subject:" , classDetails)

    res.status(201).json(newSubject);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
};


// update subject
const updateSubject = async (req, res) => {
  try {
    const { classNumber, subjectsToAdd = [], subjectsToRemove = [] } = req.body;
    console.log("classNumber is : ", classNumber);

    // Check if classNumber is a number and falls within the range of 1 to 12
    if (
      typeof classNumber !== "number" ||
      classNumber < 1 ||
      classNumber > 12
    ) {
      return res
        .status(400)
        .json({ message: "Class number must be a number between 1 and 12" });
    }

    // Find the class with the given classNumber
    let classDetails = await Class.findOne({ classNumber });

    if (!classDetails) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Validate subjects to add and remove
    const validationErrors = validateUpdateSubjects(
      subjectsToAdd,
      subjectsToRemove,
      classDetails
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Filter out duplicate subjects before adding
    const uniqueSubjectsToAdd = subjectsToAdd.filter(
      (subject) => !classDetails.subjects.includes(subject)
    );
    classDetails.subjects.push(...uniqueSubjectsToAdd);

    // Remove subjects
    if (subjectsToRemove.length > 0) {
      classDetails.subjects = classDetails.subjects.filter(
        (subject) => !subjectsToRemove.includes(subject)
      );
    }

    // Save the updated Class document
    classDetails = await classDetails.save();

    // Find or create subject document
    let subjectDoc = await Subject.findOne({ classId: classDetails._id });

    if (!subjectDoc) {
      // If subject document doesn't exist, create a new one
      subjectDoc = await Subject.create({
        classId: classDetails._id,
        classNumber,
        subjects: classDetails.subjects,
      });
    } else {
      // Update existing subject document
      subjectDoc.subjects = classDetails.subjects;
      await subjectDoc.save();
    }

    // Find all users associated with the updated class
    const users = await User.find({ classNumber });

    // Update the subjects field for each user
    for (const user of users) {
      if (user.role === "student") {
        // Add new subjects
        user.subjects.push(...uniqueSubjectsToAdd);

        // Remove subjects
        user.subjects = user.subjects.filter(
          (subject) => !subjectsToRemove.includes(subject)
        );

        // Save the updated user document
        await user.save();
      }
    }

    res.status(200).json({
      message: "Subjects updated successfully.",
      updatedSubjects: classDetails.subjects,
    });
  } catch (error) {
    console.error("Error updating subjects:", error);
    res.status(500).json({ error: "Failed to update subjects" });
  }
};

// find subject by id
const getSubject = async (req, res) => {
  try {
    const subjectId = req.body.subjectId;
    if (!subjectId) {
      return res.status(400).json("student id required.");
    }
    const foundSubjects = await Subject.findById(subjectId);

    if (!foundSubjects) {
      return res.status(400).json({ messgae: "subjects not found" });
    }
    res.status(200).json({ message: "foundSubject:", Subject: foundSubjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get subject list
const getAllSubject = async (req, res) => {
  try {
    let foundSubjects

    // Check if there are search parameters in the request body
    if (Object.keys(req.body).length > 0) {
      foundSubjects = await searchSubjects(req.body);
    } else {
      foundSubjects = await Subject.find({}).select("-password");
    }

    // Check if no users were found and send appropriate response
    if (foundSubjects.length === 0) {
      return res.status(404).json({ message: "No Subjects found matching your search criteria." });
    }
    console.log("founduser is : ", foundSubjects)

    // Send the response with the found users
    return res.status(200).json({ message: "Subjects fetched successfully!", users: foundSubjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("An error occurred:", error);
  }
};

// delete subject 
const deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.body;

    // Check if subjectId is provided
    if (!subjectId) {
      return res.status(400).json({ message: "Subject ID is required" });
    }

    // Find the subject document to get its subject names
    const subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Delete the subject document
    const deletedSubject = await Subject.findByIdAndDelete(subjectId);

    // Remove the subject references from related Class documents
    await Class.updateMany(
      { subjects: { $in: subjectDoc.subjects } },
      { $pull: { subjects: { $in: subjectDoc.subjects } } }
    );

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
};

// DELETE operation
// const deleteSubject = async (req, res) => {
//     try {
//       const { subjectId } = req.body;

//       // Delete the subject document
//       await Subject.findByIdAndDelete(subjectId);

//       // Remove the subject reference from the related Class documents
//       const deletedclass = await Class.updateMany(
//         { subjects: subjects },
//         { $pull: { subjects: subjects } }
//       );

//       res.status(200).json({ message: "Subject deleted successfully" });
//     } catch (error) {
//       console.error("Error deleting subject:", error);
//       res.status(500).json({ error: "Failed to delete subject" });
//     }
// };

module.exports = {
  createSubject,
  getSubject,
  deleteSubject,
  getAllSubject,
  updateSubject,
};
