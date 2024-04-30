const User = require("../models/user");
const Class = require ("../models/class");
const Subject = require ("../models/subject")

// Function to search users
// const searchUsers = async (searchParams) => {
//   try {
//     // Construct the search filter
//     const filter = {};

//     if (searchParams.email) filter.email = { $regex: searchParams.email, $options: 'i' };
//     if (searchParams.contact) filter.contact = { $regex: searchParams.contact, $options: 'i' };
//     if (searchParams.fullName) filter.fullName = { $regex: searchParams.fullName, $options: 'i' };

//     // Check if classNumber is provided and it's a string

//     if (typeof searchParams.classNumber === 'string') {
//       // Convert classNumber to an array
//       filter.classNumber = { $in: [searchParams.classNumber] };
//     } else if (Array.isArray(searchParams.classNumber) && searchParams.classNumber.length > 0) {

//       // If classNumber is an array and not empty, use it directly
//       filter.classNumber = { $in: searchParams.classNumber };
//       console.log("searchParams.classNumber is : ",searchParams.classNumber)

//     }

//     // Exclude documents where classNumber is not provided or is an empty array
//     filter.classNumber = { $ne: [] };

//     // Query the User collection with the constructed filter
//     const foundUsers = await User.find(filter).select("-password");
    
//     return foundUsers;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

const searchUsers = async (searchParams) => {
  try {
    // Construct the search filter
    const filter = {};

    if (searchParams.email) {
      filter.email = { $regex: searchParams.email, $options: 'i' };
    }
    if (searchParams.contact) {
      filter.contact = { $regex: searchParams.contact, $options: 'i' };
    }
    if (searchParams.fullName) {
      filter.fullName = { $regex: searchParams.fullName, $options: 'i' };
    }

    // Handle classNumber search
    if (searchParams.classNumber) {
      // Convert to array if it's a string
      const classNumberArray = Array.isArray(searchParams.classNumber)
        ? searchParams.classNumber
        : [searchParams.classNumber];
        console.log("classNumberArray is : ",classNumberArray )

      // Filter for documents with classNumber field containing a number (not empty array)
      filter.classNumber = {
        $in: classNumberArray.filter((num) => typeof num === 'number'),
      };
      console.log("filter.classNumber are : ", filter.classNumber)
    }

    // Query the User collection with the constructed filter
    const foundUsers = await User.find(filter).select("-password");
  
    return foundUsers;
    
  } catch (error) {
    throw new Error(error.message);
  }
};








// const searchSubjects = async (searchParams) => {
//     try {
//       const filter = {};
//       console.log("*")
  
//       // Check if subjects array is provided and has elements in the request body
//       if (searchParams.subjects && Array.isArray(searchParams.subjects) && searchParams.subjects.length > 0) {
//         // Use $in operator to find documents where 'subjects' array contains ALL provided subjects
//         filter.subjects = { $in: searchParams.subjects };
//         console.log("filter.subjects : ",filter.subjects)
//       } else {
//         // No subjects provided, so explicitly return an empty array to avoid unintended results
//         return [];
//       }
  
//       const foundSubjects = await Subject.find(filter);
//       return foundSubjects;
//     } catch (error) {
//       throw new Error(error.message);
//     }
//   };

const searchSubjects = async (searchParams) => {
  try {
    const filter = {};
    if (searchParams.subjects) {
      // Convert to array if it's a string
      const subjectsArray = Array.isArray(searchParams.subjects)
        ? searchParams.subjects
        : [searchParams.subjects];
        console.log("subjects is : ",subjectsArray )

      // Filter for documents with classNumber field containing a number (not empty array)
      filter.subjects = { $in: searchParams.subjects };
      console.log("filter.classNumber are : ", filter.classNumber)
    } else {
      // No subjects provided, so explicitly return an empty array to avoid unintended results
      return [];
    }

    const foundSubjects = await Subject.find(filter);
    return foundSubjects;
  } catch (error) {
    throw new Error(error.message);
  }
};

  

module.exports = {searchUsers,searchSubjects};