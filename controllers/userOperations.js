const Class = require("../models/class");

async function updateUserAndClasses(userId, role, addToClass, removeFromClass) {
  const errors = [];

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

module.exports = updateUserAndClasses;
