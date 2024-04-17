const validateFullName = (fullName) => {
  const errors = [];
  if (!fullName) {
    errors.push("Full name is required.");
  } else {
    const trimmedFullName = fullName.trim();
    // const nameRegex = /^( ?[a-zA-Z]+ ?)+$/;
    const nameRegex = /^( ?[a-zA-Z]{3,50} ?)+$/;

    if (!nameRegex.test(trimmedFullName)) {
      errors.push("Please enter your full name (only letters and spaces).");
    }
  }
  return errors;
};

const validateEmail = (email) => {
  const errors = [];
  if (!email) {
    errors.push("Email is required.");
  } else {
    const emailRegex = /^\s*[a-z0-9]+@[a-z]+\.[a-z]{2,3}\s*$/;
    if (!emailRegex.test(email)) {
      errors.push("Please enter a valid email.");
    }
  }
  return errors;
};

const validateContact = (contact) => {
  const errors = [];
  if (!contact) {
    errors.push("Contact is required.");
  } else {
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(contact)) {
      errors.push("Please enter a valid contact.");
    }
  }
  return errors;
};

const validateDOB = (DOB) => {
  const errors = [];
  if (!DOB) {
    errors.push("DOB is required.");
  } else {
    const dateParts = DOB.split("-");
    if (
      dateParts.length !== 3 ||
      dateParts[0].length !== 4 ||
      dateParts[1].length !== 2 ||
      dateParts[2].length !== 2
    ) {
      errors.push(
        "Invalid date of birth format. Date must be in yyyy-mm-dd format"
      );
    } else {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);
      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        errors.push(
          "Invalid date of birth format. Date must be in yyyy-mm-dd format"
        );
      } else if (
        (month === 4 || month === 6 || month === 9 || month === 11) &&
        day > 30
      ) {
        errors.push(
          "Invalid date of birth format. Date must be in yyyy-mm-dd format"
        );
      } else if (month === 2) {
        const isLeapYear =
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        if ((isLeapYear && day > 29) || (!isLeapYear && day > 28)) {
          errors.push(
            "Invalid date of birth format. Date must be in yyyy-mm-dd format"
          );
        }
      }
    }
  }
  return errors;
};

const validatePassword = (password) => {
  const errors = [];
  if (!password) {
    errors.push("Password is required.");
  } else {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-+_!@#$%^&*.,?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      errors.push(
        "Password must contain at least one uppercase letter, one lowercase letter, one digit, and be at least 8 characters long."
      );
    }
  }
  return errors;
};

const validateClassNumber = (classNumber) => {
  const errors = [];
  if (
    !classNumber ||
    isNaN(classNumber) ||
    classNumber < 1 ||
    classNumber > 12
  ) {
    errors.push("classNumber must be a number between 1 and 12");
  }
  return errors;
};

const validateRegistration = (req) => {
  const { fullName, email, contact, DOB, password, confirmPassword } = req.body;
  const errors = [];

  errors.push(...validateFullName(fullName));
  errors.push(...validateEmail(email));
  errors.push(...validateContact(contact));
  errors.push(...validateDOB(DOB));
  errors.push(...validatePassword(password));
  if (!confirmPassword) {
    errors.push("Confirm password is required.");
  } else if (password !== confirmPassword) {
    errors.push("Passwords do not match.");
  }

  return errors;
};

const validateSubjects = (subjects, classNumber) => {
  const errors = [];

  // Validate classNumber range (1-12)
  if (typeof classNumber !== "number" || classNumber < 1 || classNumber > 12) {
    errors.push("Class number must be between 1 and 12.");
  }

  // Remove duplicate subjects
  const uniqueSubjects = [...new Set(subjects)];
  console.log("uniqueSubjects",uniqueSubjects)

  // Minimum subject count check (only for initial creation)
  if (classNumber >= 1 && classNumber <= 12 && uniqueSubjects.length === 0) {
    errors.push(`At least ${classNumber >= 11 ? 4 : 3} subjects are required`);
  }

  // Validate subject content based on classNumber
  if (classNumber >= 1 && classNumber <= 10) {
    const allowedSubjects = [
      "maths",
      "science",
      "english",
      "hindi",
      "gujarati",
      "sanskrit",
      "social-science",
      "geography",
    ];

    const invalidSubjects = uniqueSubjects.filter(
      (subject) => !allowedSubjects.includes(subject.toLowerCase())
    );
    console.log("uniqueSubjects at filter: ",uniqueSubjects)

    if (invalidSubjects.length > 0) {
      errors.push(
        `Invalid subjects: ${invalidSubjects.join(
          ", "
        )} (allowed subjects: ${allowedSubjects.join(", ")})`
      );
    }
  } else if (classNumber >= 11 && classNumber <= 12) {
    const allowedSubjects = [
      "physics",
      "chemistry",
      "biology",
      "maths",
      "sanskrit",
      "english",
      "economics",
      "finance",
      "sociology",
    ];

    const invalidSubjects = uniqueSubjects.filter(
      (subject) => !allowedSubjects.includes(subject.toLowerCase())
    );

    if (invalidSubjects.length > 0) {
      errors.push(
        `Invalid subjects: ${invalidSubjects.join(
          ", "
        )} (allowed subjects: ${allowedSubjects.join(", ")})`
      );
    }
  }

  return errors;
};


const validateUpdateSubjects = (
  subjectsToAdd,
  subjectsToRemove,
  classDetails
) => {
  const errors = [];

  const allowedSubjects =
    classDetails.classNumber >= 1 && classDetails.classNumber <= 10
      ? [
          "maths",
          "science",
          "english",
          "hindi",
          "gujarati",
          "sanskrit",
          "social-science",
          "geography",
        ]
      : [
          "physics",
          "chemistry",
          "biology",
          "maths",
          "sanskrit",
          "english",
          "economics",
          "finance",
          "sociology",
        ];

  // Validate subjectsToAdd
  for (const subject of subjectsToAdd) {
    if (!allowedSubjects.includes(subject.toLowerCase())) {
      errors.push(`${subject} is not a valid subject to add.`);
    } else if (classDetails.subjects.includes(subject)) {
      errors.push(`${subject} already exists in this class.`);
    }
  }

  // Validate subjectsToRemove (optional)
  if (subjectsToRemove.length > 0) {
    for (const subject of subjectsToRemove) {
      if (!classDetails.subjects.includes(subject)) {
        errors.push(
          `${subject} is not present in this class and cannot be removed.`
        );
      }
    }
  }

  return errors;
};

module.exports = {
  validateFullName,
  validateEmail,
  validateContact,
  validateDOB,
  validatePassword,
  validateRegistration,
  validateClassNumber,
  validateSubjects,
  validateUpdateSubjects,
};
