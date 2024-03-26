const jwt = require("jsonwebtoken");
const secretKey = "secret_key";


// verify admin
const isAdmin = (req, res, next) => {
    const { role } = req.user;
    console.log("========>")
    console.log("role at isAdmin func",role)
    if (role !== 'admin' && role !== "superadmin") {
        return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }    
    next();
};

// verify Token
function verifyToken(req, res, next) {
    let token = req.headers.authorization; 
    console.log(token);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized! Token not provided." });
    }
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      req.user = decoded;
      console.log("decoded user : ", req.user);
      
      next();
    });
};

module.exports = {verifyToken, isAdmin};