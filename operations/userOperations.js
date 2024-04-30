const Class = require("../models/class");
const User = require("../models/user")
const {validateUpdateSubjects,validateUpdateSubjectsToremove} = require("../validations/validator")

async function updateUserAndClasses(userId, role, addToClass, removeFromClass) {
  const errors = [];
  // Fetch user details
  const user = await User.findById(userId);

  if (addToClass !== undefined) {
    if (!Array.isArray(addToClass) || addToClass.some(isNaN)) {
      errors.push("addToClass field must be an array of numbers");
    } else {
      for (const classNumber of addToClass) {
        const classObj = await Class.findOne({ classNumber: classNumber });
        if (!classObj) {
          errors.push(`Class with number ${classNumber} does not exist.`);
          continue;
        }
        if (role === "teacher") {
          if (!classObj.teachers.includes(userId)) {
            classObj.teachers.push(userId);
            classObj.totalTeachers = classObj.totalTeachers
              ? classObj.totalTeachers + 1
              : 1;
          }
        } else if (role === "student") {
          const existingClass = user.classNumber && user.classNumber.length > 0;
          if (existingClass) {
            errors.push(
              "Students can only be enrolled in one class at a time."
            );
            break;
          }
          if (!classObj.students.includes(userId)) {
            classObj.students.push(userId);
            classObj.totalStudents = classObj.totalStudents
              ? classObj.totalStudents + 1
              : 1;
          }
        }
        await classObj.save();
        console.log(
          `Total Students after adding to class ${classNumber}: ${classObj.totalStudents}`
        );
      }
    }
  }
  
  // Logic for removing user from classes (if removeFromClass is provided)
  if (removeFromClass !== undefined) {
    if (!Array.isArray(removeFromClass) || removeFromClass.some(isNaN)) {
      errors.push("removeFromClass field must be an array of numbers");
    } else {
      for (const classNumber of removeFromClass) {
        const classObj = await Class.findOne({ classNumber: classNumber });
        if (!classObj) {
          errors.push(`Class with number ${classNumber} does not exist.`);
          continue;
        }
        if (role === "teacher") {
          if (classObj.teachers.includes(userId)) {
            classObj.teachers.pull(userId);
            classObj.totalTeachers = classObj.totalTeachers
              ? classObj.totalTeachers - 1
              : 0;
          } else {
            errors.push(
              `User with ID ${userId} is not a teacher in class ${classNumber}.`
            );
          }
        } else if (role === "student") {
          if (classObj.students.includes(userId)) {
            classObj.students.pull(userId);
            classObj.totalStudents = classObj.totalStudents
              ? classObj.totalStudents - 1
              : 0;
          } else {
            errors.push(
              `User with ID ${userId} is not a student in class ${classNumber}.`
            );
          }
        }
        await classObj.save();
        console.log(
          `Total Students after removing from class ${classNumber}: ${classObj.totalStudents}`
        );
      }
    }
  }

  return errors;
}

async function updateStudentSubjects(userId, role, userData, userClassNumbers) {
  if (role !== "student") {
    throw new Error("This function is only for students");
  }

  const { subjectsToStudy, removeSubjectToStudy } = userData;

  if (!subjectsToStudy && !removeSubjectToStudy) {
    // If neither subjectsToStudy nor removeSubjectToStudy is provided, no action is needed
    return;
  }

  // Fetch user and validate existence
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Fetch valid subjects in the classes the student is enrolled in
  const validSubjectsInClass = [];
  for (const classNumber of userClassNumbers) {
    const classObj = await Class.findOne({ classNumber });
    if (classObj) {
      validSubjectsInClass.push(...classObj.subjects);
    }
  }

// Handle subjectsToStudy for students
if (subjectsToStudy) {
  // Filter out subjects from subjectsToStudy that are not valid subjects in the class
  const validStudySubjects = subjectsToStudy.filter(subject => validSubjectsInClass.includes(subject));
  console.log("validStudySubjects are: ",validStudySubjects)

  // Check if any subjects in subjectsToStudy are not valid in the class
  const invalidSubjects = subjectsToStudy.filter(subject => !validSubjectsInClass.includes(subject));
  console.log("invalidSubjects are :",invalidSubjects)
  
  if (invalidSubjects.length > 0) {
    throw new Error(`Invalid subjects to study: ${invalidSubjects.join(', ')}`);
  }
  
  // Update subjectsToStudy for the user
  user.subjects = [...new Set([...user.subjects, ...validStudySubjects])];
  console.log("user.subjects are : ",user.subjects)
}

  // Handle removeSubjectToStudy for students
  if (removeSubjectToStudy) {

    // Filter out subjects from removeSubjectToStudy that are not valid subjects in the class
    const validRemoveSubjects = removeSubjectToStudy.filter(subject => validSubjectsInClass.includes(subject));
    console.log("valid subject in class is : ", validSubjectsInClass)
    console.log("validRemoveSubjects are : ",validRemoveSubjects)

    const invalidSubjects = removeSubjectToStudy.filter(subject => !validSubjectsInClass.includes(subject));
    console.log("invalidSubjects are : ",invalidSubjects)

    
    if (invalidSubjects.length > 0) {
      throw new Error(`Invalid subjects to remove from study: ${invalidSubjects.join(', ')}`);
    }
    
    // Remove subjects from subjectsToStudy for the user
    user.subjects = user.subjects.filter(subject => !validRemoveSubjects.includes(subject));
    console.log("user.SubjectToStudy after removal of subject : ",user.subjects)
  }

  // Save the updated user
  await user.save();
  // console.log("user after sub removal is : ", user)
}

async function updateUserSubjects(userId, role, userData, userClassNumbers) {
  const { subjectToTeach, removeSubjectToTeach } = userData;


  // Handle subjectToTeach based on user's role and classes assigned
  if (role === "teacher" && subjectToTeach) {
    const subjectsToAdd = [];

    // Fetch the class object for each class the teacher is assigned to
    for (const classNumber of userClassNumbers) {
      const classObj = await Class.findOne({ classNumber });
      console.log("==============> class obj:", classObj);

      if (classObj && classObj.teachers.includes(userId)) {
        // If the teacher is assigned to the class, add subjects of that class to subjectsToAdd
        subjectsToAdd.push(...classObj.subjects);
      }
      console.log("=============> subjectsToAdd is : ", subjectsToAdd);
    }

    // Filter out subjects that the teacher is not enrolled in (if the field is present in request body)
    if (subjectToTeach) {
      userData.subjectToTeach = subjectToTeach.filter((subject) =>
        subjectsToAdd.includes(subject)
      );
    }

    // Update the user data in the database
    await User.findByIdAndUpdate(
      userId,
      { ...userData, updatedAt: new Date() },
      { new: true, select: "-password" }
    );
  } else if (
    role === "student" &&
    !removeSubjectToTeach &&
    !userData.addSubjectToTeach
  ) {
    // If the role is student and subjectToTeach field is not present in request body, ensure that subjectToTeach field is not updated
    delete userData.subjectToTeach;
    await User.findByIdAndUpdate(userId, { ...userData });
  }






// Handle removing subjects from subjectToTeach field
if ("removeSubjectToTeach" in userData) {
  console.log("============>")

  console.log("removeSubjectToTeach:", removeSubjectToTeach);
  const user = await User.findById(userId);

  const validSubjectsInClass = []; // Store valid subjects present in the class
  for (const classNumber of userClassNumbers) {
    const classObj = await Class.findOne({ classNumber });
    if (classObj) {
      validSubjectsInClass.push(...classObj.subjects);
      console.log("validSubjects in class is : ", validSubjectsInClass)
    }
  }
    // Filter out subjects from removeSubjectToTeach that are not valid subjects in the class
    const validRemoveSubjects = removeSubjectToTeach.filter(subject => validSubjectsInClass.includes(subject));

    // Check if any subjects in validRemoveSubjects are not valid in the class
    const invalidSubjects = removeSubjectToTeach.filter(subject => !validSubjectsInClass.includes(subject));
    
    if (invalidSubjects.length > 0) {
      throw new Error(`Invalid subjects: ${invalidSubjects.join(', ')}`);
    }
  
    // Check if the user is a teacher and teaching the subject to remove
    if (user.role === 'teacher') {
      for (const subject of validRemoveSubjects) {
        if (user.subjectToTeach.includes(subject)) {
          // Remove the subject from subjectToTeach array
          user.subjectToTeach = user.subjectToTeach.filter(s => s !== subject);
          console.log(`Subject removed from subjectToTeach: ${subject}`);
        }
      }
    }
  
  

  // Save the updated user
  await user.save();
  // console.log("user after removingSubject:", user)

  // console.log("user.password", user.password);
}
}








module.exports = {updateUserAndClasses,updateUserSubjects,updateStudentSubjects};
