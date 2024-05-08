const OTP = require(`../models/otp`)
const Subject = require(`../models/subject`);
const Class = require(`../models/class`);
const User = require(`../models/user`);
const {
  validateFullName,
  validateEmail,
  validateContact,
  validateDOB,
  validatePassword,
  validateRegistration,
  validateClassNumber,
  validateSubjects,
  validateSubjectAtClass,
} = require(`../validations/validator`);

const createClass = async (req, res) => {
  const { classNumber, classTeacherId, subjects } = req.body;
  try {
    // validate classNumber
    const classNumberErrors = validateClassNumber(classNumber);
    if (classNumberErrors.length > 0) {
      return res.status(400).json({ errors: classNumberErrors });
    }
    if (!classTeacherId) {
      return res
        .status(400)
        .json({ error: "Class teacher ID, subjects is required." });
    }
    const invalidSubjects = [];
    for (const subject of subjects) {
      const existingSubject = await Subject.findOne({ subject });
      if (!existingSubject) {
        invalidSubjects.push(subject);
        console.log("invalidsubjects:", invalidSubjects);
      }
    }
    if (invalidSubjects.length > 0) {
      return res
        .status(400)
        .json({ error: `Subjects not found: ${invalidSubjects.join(", ")}` });
    }

    // Check if classteacherId corresponds to an existing teacher
    const existingTeacher = await User.findOne({
      _id: classTeacherId,
      role: "teacher",
    });
    if (!existingTeacher) {
      return res
        .status(404)
        .json({ error: "Class teacher not found or is not a teacher." });
    }
    const existingClass = await Class.findOne({ classTeacherId });
    if (existingClass) {
      return res.status(400).json({
        error:
          "Teacher is already assigned as class teacher for another class.",
      });
    }

    // Create new class
    const newClass = new Class({
      classNumber: parseInt(classNumber),
      classTeacherId: classTeacherId,
      subjects: subjects,
    });

    // Save the new class to the database
    await newClass.save();

    // Update the respective teacher's classTeacherOf field
    existingTeacher.classTeacherOf.push(newClass._id);
    await existingTeacher.save();

    // Update the subjectsToStudy field for all students enrolled in this class
    const studentsInClass = await User.find({
      classNumber: newClass.classNumber,
      role: "student",
    });
    for (const student of studentsInClass) {
      student.subjects = subjects;
      await student.save();
    }

    res
      .status(200)
      .json({ message: "Class created successfully!", class: newClass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create class." });
  }
};

// findOne
const findOneClass = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(404).json({ message: "please provide userId." });
    }

    const foundClass = await Class.findOne({ _id: userId }).select("-password");
    if (!foundClass) {
      return res.status(404).json({ message: "class not found" });
    }

    res.status(200).json({ message: "user found:", class: foundClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const getAllClass = async (req, res) => {
//   try {
//     const { classNumber, teacherName, studentName } = req.body;

//     if (classNumber) {
//       // Find class by classNumber
//       const foundClass = await Class.findOne({ classNumber });
//       if (!foundClass) {
//         return res
//           .status(404)
//           .json({ message: `Class with classNumber ${classNumber} not found` });
//       }
//       return res.json(foundClass);
//     } else if (teacherName) {
//       // Find class by teacher's name
//       const classByTeacherName = await User.aggregate([
//         {
//           $lookup: {
//             from: 'users',
//             localField: 'teachers',
//             foreignField: '_id',
//             as: 'teachers',
//           },
//         },
//         {
//           $match: {
//             'teachers.fullName': teacherName,
//           },
//         },
//       ]);

//       if (classByTeacherName.length === 0) {
//         return res.status(404).json({ message: 'No class found for the given teacher name' });
//       }

//       return res.json(classByTeacherName);
//     } else if (studentName) {
//       // Find class by student's name (with regex to find similar names)
//       const classByStudentName = await Class.aggregate([
//         {
//           $lookup: {
//             from: 'users',
//             localField: 'students',
//             foreignField: '_id',
//             as: 'students',
//           },
//         },
//         {
//           $match: {
//             'students.fullName': { $regex: studentName, $options: 'i' }, // Case insensitive regex match
//           },
//         },
//       ]);

//       if (classByStudentName.length === 0) {
//         return res.status(404).json({ message: 'No class found for the given student name' });
//       }

//       return res.json(classByStudentName);
//     } else {
//       // Fetch list of all classes
//       const allClasses = await Class.find();
//       return res.json(allClasses);
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// const getAllClass = async (req, res) => {
//   try {
//     const { classNumber } = req.body;

//     if (classNumber) {
//       // Find class by classNumber given in request body
//       const foundClass = await Class.findOne({ classNumber });

//       if (!foundClass) {
//         return res
//           .status(404)
//           .json({ message: `Class with classNumber ${classNumber} not found` });
//       }

//       return res.json(foundClass);
//     } else {
//       // Fetch list of all classes
//       const allClasses = await Class.find();
//       return res.json(allClasses);
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };






// const getAllClass = async (req, res) => {
//   try {
//     const { classNumber, studentName, teacherName } = req.body;

//     if (classNumber) {
//       // Find class by classNumber
//       const foundClass = await Class.findOne({ classNumber })
//         .populate('students', 'fullName')
//         .populate('teachers', 'fullName')
//         .populate('classTeacherId', 'fullName');

//       if (!foundClass) {
//         return res
//           .status(404)
//           .json({ message: `Class with classNumber ${classNumber} not found` });
//       }
//       return res.json(foundClass);
//     } else if (studentName || teacherName) {
//       // Find class by studentName or teacherName
//       const classByName = await Class.aggregate([
//         {
//           $lookup: {
//             from: 'users',
//             localField: 'students',
//             foreignField: '_id',
//             as: 'students',
//           },
//         },
//         {
//           $lookup: {
//             from: 'users',
//             localField: 'teachers',
//             foreignField: '_id',
//             as: 'teachers',
//           },
//         },
//         {
//           $lookup: {
//             from: 'users',
//             localField: 'classTeacherId',
//             foreignField: '_id',
//             as: 'classTeacher',
//           },
//         },
//         {
//           $match: {
//             $or: [
//               { 'students.fullName': studentName },
//               { 'teachers.fullName': teacherName },
//               { 'classTeacher.fullName': teacherName },
//             ],
//           },
//         },
//         {
//           $project: {
//             classNumber: 1,
//             students: {
//               $filter: {
//                 input: '$students',
//                 as: 'student',
//                 cond: { $eq: ['$$student.fullName', studentName] },
//               },
//             },
//             teachers: {
//               $filter: {
//                 input: '$teachers',
//                 as: 'teacher',
//                 cond: { $eq: ['$$teacher.fullName', teacherName] },
//               },
//             },
//             classTeacher: {
//               $filter: {
//                 input: '$classTeacher',
//                 as: 'teacher',
//                 cond: { $eq: ['$$teacher.fullName', teacherName] },
//               },
//             },
//           },
//         },
//       ]);

//       if (classByName.length === 0) {
//         return res.status(404).json({ message: 'No class found for the given name' });
//       }

//       return res.json(classByName);
//     } else {
//       // Fetch list of all classes
//       const allClasses = await Class.find()
//         .populate('students', 'fullName')
//         .populate('teachers', 'fullName')
//         .populate('classTeacherId', 'fullName');

//       return res.json(allClasses);
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// ========> updateclass

const getAllClass = async (req, res) => {
  try {
    const { classNumber, teacherName, studentName } = req.body;

    // Find class by classNumber
    const foundClass = await Class.findOne({ classNumber });

    if (!foundClass) {
      return res.status(404).json({ message: `Class with classNumber ${classNumber} not found` });
    }

    // Extract teacher and student IDs from the found class
    const { teachers, students } = foundClass;

    // Search for users with matching names
    const matchingUsers = await User.find({
      $or: [
        { _id: { $in: teachers }, fullName: teacherName },
        { _id: { $in: students }, fullName: studentName }
      ]
    });

    if (matchingUsers.length === 0) {
      return res.status(404).json({ message: 'No user found with the provided name in the class' });
    }

    return res.json(matchingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// const getAllClass = async (req, res) => {
//   try {
//     const { classNumber } = req.body;

//     if (classNumber) {
//       // Find class by classNumber given in request body
//       const foundClass = await Class.findOne({ classNumber });

//       if (!foundClass) {
//         return res
//           .status(404)
//           .json({ message: `Class with classNumber ${classNumber} not found` });
//       }

//       return res.json(foundClass);
//     } else {
//       // Fetch list of all classes
//       const allClasses = await Class.find();
//       return res.json(allClasses);
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const updateClass = async (req, res) => {
  const classId = req.body.classId;
  const {
    studentsToAdd,
    studentsToRemove,
    teachersToAdd,
    teachersToRemove,
    subjectToAdd,
    subjectToRemove,
    addClassTeacher,
    removeClassTeacher,
  } = req.body;
  try {
    if (!classId) {
      return res.status(400).json({ message: "classId is required." });
    }

    // Find the class by ID
    let existingClass = await Class.findById(classId);
    classDetails = existingClass;
    console.log("existingClass is : ", existingClass);
    // console.log("classNumber of existingclass is : ", existingClass.classNumber)

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    //     ***   Add students to the class
    if (studentsToAdd && studentsToAdd.length > 0) {
      for (const studentId of studentsToAdd) {
        // Check if the student is already enrolled in another class
        const studentInOtherClass = await Class.findOne({
          students: studentId,
          _id: { $ne: classId },
        });
        if (studentInOtherClass) {
          return res.status(400).json({
            message: `Student with ID ${studentId} already belongs to another class.`,
          });
        }
        // Check if the student is already enrolled in this class
        if (existingClass.students.includes(studentId)) {
          return res.status(400).json({
            message: `Student with ID ${studentId} is already enrolled in this class.`,
          });
        }
        // Retrieve the role of the user associated with the studentId
        const user = await User.findById(studentId);
        console.log("user at addstudent: ", user);
        if (!user) {
          return res.status(400).json({
            message: `Student with ID ${studentId} not found in User collection.`,
          });
        }
        const role = user.role;

        if (role !== "student") {
          // If the user's role is not "student", skip the update and provide a message
          return res
            .status(400)
            .json(`role is not student for ID ${studentId}.`);
          // continue;
        }
        existingClass.students.push(studentId);
        console.log("total students at add", existingClass.totalStudents);
        if (typeof existingClass.totalStudents === "number") {
          existingClass.totalStudents += 1;
        } else {
          existingClass.totalStudents = 1; // Set to 1 if not a number initially
        }

        // Update user data with the classNumber
        const updateduser = await User.findOneAndUpdate(
          { _id: studentId },
          { $push: { classNumber: existingClass.classNumber } },
          { new: true }
        );

        if (!updateduser) {
          return res.status(400).json({
            message: `Student with ID ${studentId} not found in User collection.`,
          });
        }
      }
    }

    // console.log(studentsToRemove);
    //    ***   Remove students from the class
    if (studentsToRemove && studentsToRemove.length > 0) {
      for (const studentId of studentsToRemove) {
        // Retrieve the role of the user associated with the studentId
        const user = await User.findById(studentId);
        const role = user.role;

        if (role !== "student") {
          // If the user's role is not "student", skip the update and provide a message
          return res
            .status(400)
            .json(`role is not student for ID ${studentId}.`);
          // continue;
        }

        // Check if the student is present in the current class
        if (!existingClass.students.includes(studentId)) {
          return res.status(400).json({
            message: `Student with ID ${studentId} is not present in this class.`,
          });
        }

        // Remove student from class
        existingClass.students = existingClass.students.filter(
          (id) => id.toString() !== studentId.toString()
        );

        // Update totalStudents count
        if (typeof existingClass.totalStudents === "number") {
          existingClass.totalStudents -= 1;
        } else {
          existingClass.totalStudents = 1; // Set to 1 if not a number initially
        }
        // Find and update user data
        const updateduser = await User.findOneAndUpdate(
          { _id: studentId },
          { $pull: { classNumber: existingClass.classNumber } }, // Remove classNumber from array
          { new: true }
        );

        if (!updateduser) {
          console.error(`User with ID ${studentId} not found.`);
          // Handle error if user is not found
        }
      }
    }

    //     ***   Add teachers to the class
    if (teachersToAdd && teachersToAdd.length > 0) {
      for (const teacherId of teachersToAdd) {
        // Check if the teacher is already present in the class
        if (existingClass.teachers.includes(teacherId)) {
          return res.status(400).json({
            message: `Teacher with ID ${teacherId} is already present in this class.`,
          });
        }
        // Retrieve the role of the user associated with the teacherId
        const user = await User.findById(teacherId);
        const role = user.role;
        if (role !== "teacher") {
          // If the user's role is not "student", skip the update and provide a message
          return res
            .status(400)
            .json(`role is not teacher for ID ${teacherId}.`);
          // continue;
        }
        existingClass.teachers.push(teacherId);
        if (typeof existingClass.totalTeachers === "number") {
          existingClass.totalTeachers += 1;
        } else {
          existingClass.totalTeachers = 1; // Set to 1 if not a number initially
        } // Find and update user data
        const updateduser = await User.findOneAndUpdate(
          { _id: teacherId },
          { $push: { classNumber: existingClass.classNumber } },
          { new: true }
        );
        if (!updateduser) {
          return res.status(400).json(`User with ID ${teacherId} not found.`);
        }
      }
    }

    //     ***    Remove teachers from the class (update totalTeachers count)
    if (teachersToRemove && teachersToRemove.length > 0) {
      for (const teacherId of teachersToRemove) {
        // check if teacher exist in current class
        if (!existingClass.teachers.includes(teacherId)) {
          return res.status(400).json({
            message: `Teacher with ID ${teacherId} is not present in this class.`,
          });
        }
        // Retrieve the role of the user associated with the teacherId
        const user = await User.findById(teacherId);
        const role = user.role;
        if (role !== "teacher") {
          // If the user's role is not "student", skip the update and provide a message
          return res
            .status(400)
            .json(`role is not teacher for ID ${teacherId}.`);
          // continue;
        }
        // Remove teacher from class
        existingClass.teachers = existingClass.teachers.filter(
          (teacher) => teacher.toString() !== teacherId.toString()
        );

        // Update totalTeachers count
        if (typeof existingClass.totalTeachers === "number") {
          existingClass.totalTeachers -= 1;
        } else {
          existingClass.totalTeachers = 1; // Set to 1 if not a number initially
        }
        // Find and update user data
        const updateduser = await User.findOneAndUpdate(
          { _id: teacherId },
          { $pull: { classNumber: existingClass.classNumber } }, // Remove classNumber from array
          { new: true }
        );

        if (!updateduser) {
          return res.status(400).json(`User with ID ${teacherId} not found.`);
        }
      }
    }
    // Validate subjects to add and remove
    const validationErrors = validateSubjectAtClass(
      subjectToAdd || [],
      subjectToRemove || [],
      classDetails
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Add subjects
    if (subjectToAdd && subjectToAdd.length > 0) {
      subjectToAdd.forEach((subject) => {
        if (!existingClass.subjects.includes(subject)) {
          existingClass.subjects.push(subject);
        }
      });
    }

    // Remove subjects
    if (subjectToRemove && subjectToRemove.length > 0) {
      // Store the initial length of existingClass.subjects
      const initialLength = existingClass.subjects.length;

      // Filter out subjects that are present in subjectToRemove
      existingClass.subjects = existingClass.subjects.filter(
        (subject) => !subjectToRemove.includes(subject)
      );

      // If the length of existingClass.subjects didn't change, none of the specified subjects were found in the class's subjects list
      if (existingClass.subjects.length === initialLength) {
        return res.status(400).json({
          message: `${subjectToRemove.join(", ")} subject not present in class`,
        });
      }
    }

    // Find subjects associated with the class
    const subjectsToUpdate = await Subject.find({ classId: classId });

    // Update subjects with the new list of subjects associated with the class
    subjectsToUpdate.forEach((subject) => {
      subject.subjects = existingClass.subjects;
    });

    // Save the updated subjects collection to the database
    await Promise.all(subjectsToUpdate.map((subject) => subject.save()));

    // Save the updated class
    existingClass = await existingClass.save();

    // Find the class document using the classId
    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      // Handle case where class with the provided classId is not found
      return res.status(404).json({ error: "Class not found" });
    }

    // Retrieve classNumber from the class document
    const classNumber = classDoc.classNumber;

    // Use the classNumber to find users
    const usersToUpdate = await User.find({ classNumber: classNumber });

    console.log("usersToUpdate is : ", usersToUpdate);

    // Update subjects for each user
    const updatedUsers = await Promise.all(
      usersToUpdate.map(async (user) => {
        // Initialize user.subjects as an empty array if it's not already an array
        if (!Array.isArray(user.subjects)) {
          user.subjects = [];
        }

        // Remove subjects that are being removed from the class
        if (subjectToRemove && subjectToRemove.length > 0) {
          user.subjects = user.subjects.filter(
            (subject) => !subjectToRemove.includes(subject)
          );
        }

        // Add subjects that are being added to the class
        if (subjectToAdd && subjectToAdd.length > 0) {
          console.log("subjectsToAdd is : ", subjectToAdd);
          subjectToAdd.forEach((subject) => {
            if (!user.subjects.includes(subject)) {
              user.subjects.push(subject);
              console.log(
                `Subject '${subject}' added for user '${user.fullName}'`
              );
              console.log("user.subjects are : ", user.subjects);
            }
          });
        }

        // Save the updated user document
        return user.save();
      })
    );

    // console.log("*");
    // console.log("*");
    // console.log("*");
    // console.log("*");

    // console.log("Updated users:", updatedUsers);

    // res.status(200).json({
    //   message: "Class and associated users updated successfully",
    //   updatedClass: existingClass,
    //   updatedUsers,
    // });

    // Adding Class Teacher
    console.log("==>");
    if (addClassTeacher && addClassTeacher.length > 0) {
      for (const teacherId of addClassTeacher) {
        console.log(`Adding teacher with ID ${teacherId} as class teacher...`);
        const user = await User.findById(teacherId);
        if (!user || user.role !== "teacher") {
          console.log(`User with ID ${teacherId} is not a teacher.`);
          return res.status(400).json({
            message: `User with ID ${teacherId} is not a teacher.`,
          });
        }
        // Check if the teacher is already a class teacher
        const isClassTeacher = await Class.findOne({
          classTeacherId: teacherId,
        });
        if (isClassTeacher) {
          console.log(`User with ID ${teacherId} is already a class teacher.`);
          return res.status(400).json({
            message: `User with ID ${teacherId} is already a class teacher.`,
          });
        }
        // Set the teacher as the class teacher
        existingClass.classTeacherId = teacherId;
        console.log(`Teacher with ID ${teacherId} added as class teacher.`);

        // Push the class ID into the user's classTeacherOf array
        await User.findByIdAndUpdate(
          teacherId,
          { $push: { classTeacherOf: existingClass._id } },
          { new: true }
        );
      }
      existingClass = await existingClass.save();
    }

    // Removing Class Teacher
    if (removeClassTeacher && removeClassTeacher.length > 0) {
      for (const teacherId of removeClassTeacher) {
        console.log(
          `Removing teacher with ID ${teacherId} as class teacher...`
        );
        const user = await User.findById(teacherId);
        if (!user || user.role !== "teacher") {
          console.log(`User with ID ${teacherId} is not a teacher.`);
          return res.status(400).json({
            message: `User with ID ${teacherId} is not a teacher.`,
          });
        }
        console.log("**********");
        existingClass.classTeacherId = null; // Set classTeacherId to null

        const updatedUser = await User.findByIdAndUpdate(
          teacherId,
          { $pull: { classTeacherOf: existingClass._id } },
          { new: true }
        );
        console.log("existingClass._id is :", existingClass._id);
        console.log("updated user: ", updatedUser);
        if (!updatedUser) {
          console.error(`Failed to update user ${teacherId}.`);
        }
        console.log(`Teacher with ID ${teacherId} removed as class teacher.`);
      }
      existingClass = await existingClass.save();
      console.log("existingClass", existingClass);
    }

    res
      .status(200)
      .json({ message: "Class updated successfully", class: existingClass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteClass = async (req, res) => {
  const classId = req.body._id;

  try {
    // Delete the class record
    const deletedClass = await Class.findByIdAndDelete(classId);
    console.log("class id is:", classId);

    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  findOneClass,
  getAllClass,
  createClass,
  updateClass,
  deleteClass,
};

