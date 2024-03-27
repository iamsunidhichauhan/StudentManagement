

const validateFullName = (fullName) => {
    const errors = [];
    if (!fullName) {
        errors.push("Full name is required.");
    } else {
        const trimmedFullName = fullName.trim();
        // const nameRegex = /^( ?[a-zA-Z]+ ?)+$/;
        const nameRegex = /^( ?[a-zA-Z]{3,50} ?)+$/;

        if (!nameRegex.test(trimmedFullName)) {
            errors.push('Please enter your full name (only letters and spaces).');
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
            errors.push('Please enter a valid email.');
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
            errors.push('Please enter a valid contact.');
        }
    }
    return errors;
};

const validateDOB = (DOB) => {
    const errors = [];
    if (!DOB) {
        errors.push("DOB is required.");
    } else {
        const dateParts = DOB.split('-');
        if (dateParts.length !== 3 || dateParts[0].length !== 4 || dateParts[1].length !== 2 || dateParts[2].length !== 2) {
            errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
        } else {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const day = parseInt(dateParts[2], 10);
            if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
                errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
            } else if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) {
                errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
            } else if (month === 2) {
                const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                if ((isLeapYear && day > 29) || (!isLeapYear && day > 28)) {
                    errors.push('Invalid date of birth format. Date must be in yyyy-mm-dd format');
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
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-+_!@#$%^&*.,?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            errors.push('Password must contain at least one uppercase letter, one lowercase letter, one digit, and be at least 8 characters long.');
        }
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

module.exports = { 
    validateFullName, 
    validateEmail, 
    validateContact, 
    validateDOB, 
    validatePassword, 
    validateRegistration 
};

