const Subject = require (`../models/subject`);
const Class = require("../models/class");


// CREATE 
const createSubject = async (req, res) => {
    try {
      const { classNumber, subjects } = req.body;

      // Find the class with the given classNumber
      const classDetails = await Class.findOne({ classNumber });

      console.log("classNumber is :",classNumber)
      if(typeof classNumber !== 'number' || classNumber < 1 || classNumber > 10){
        return res.status(400).json({message:"Class number must be a number between 1 and 10"})
      }
  
  
      if (!classDetails) {
        return res.status(404).json({ error: "Class not found" });
      }
        // Check if subjects have already been created for this class
        if(classDetails.subjects.length > 0 ){
            return res.status(400).json({message:"subjects already been declared for this class."})
        }
  
      // Create a new subject document
      const newSubject = await Subject.create({ classId: classDetails._id, classNumber, subjects });
  
      // Push the new subjects into the subjects array of the corresponding Class document
      classDetails.subjects.push(...subjects);
  
      // Save the updated Class document
      await classDetails.save();
  
      res.status(201).json(newSubject);
    } catch (error) {
      console.error("Error creating subject:", error);
      res.status(500).json({ error: "Failed to create subject" });
    }
};




// UPDATE
const updateSubject = async (req, res) => {
  try {
      const { classNumber, subjectsToAdd = [], subjectsToRemove = [] } = req.body;

      // Check if classNumber is a number and falls within the range of 1 to 10
      if (typeof classNumber !== 'number' || classNumber < 1 || classNumber > 10) {
          return res.status(400).json({ message: "Class number must be a number between 1 and 10" });
      }

      // Find the class with the given classNumber
      let classDetails = await Class.findOne({ classNumber });

      if (!classDetails) {
          return res.status(404).json({ error: "Class not found" });
      }

      // Filter out duplicate subjects before adding
      const uniqueSubjectsToAdd = subjectsToAdd.filter(subject => !classDetails.subjects.includes(subject));
      classDetails.subjects.push(...uniqueSubjectsToAdd);

      // Remove subjects
      if (subjectsToRemove.length > 0) {
          classDetails.subjects = classDetails.subjects.filter(subject => !subjectsToRemove.includes(subject));
      }

      // Save the updated Class document
      classDetails = await classDetails.save();

      res.status(200).json({ message: "Subjects updated successfully.", updatedSubjects: classDetails.subjects });
  } catch (error) {
      console.error("Error updating subjects:", error);
      res.status(500).json({ error: "Failed to update subjects" });
  }
};




  







const getSubject = async(req,res)=>{
    try {
        const subjectId = req.body.subjectId;
        if(!subjectId){
            return res. status(400).json("student id required.")
        };
        const foundSubjects = await Subject.findById(subjectId)
        console.log("foundSubjects :",foundSubjects)
        console.log("subjectId", subjectId)
        if(!foundSubjects){
            return res.status(400).json({messgae: "subjects not found"})
        }
        res. status(200).json({message:"foundSubject:", Subject:foundSubjects })
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

// get subject list
const getAllSubject = async(req,res)=>{
    try {
        const subjects = await Subject.find({});
        if (!subjects || subjects.length === 0) {
          return res.status(404).json({ message: "No subjects found." });
        }
        res.status(200).json({ message: "List of all subjects:", subjects });
      } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


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



module.exports = {createSubject, getSubject,deleteSubject,getAllSubject,updateSubject}