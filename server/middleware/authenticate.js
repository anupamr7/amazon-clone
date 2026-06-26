const jwt = require("jsonwebtoken");
const USER = require("../models/userSchema");
const secretKey = process.env.KEY;

const athenticate = async (req, res, next) => {
    try {
        const token = req.cookies.Amazonweb;

        if (!token) {
            // If no token, send a 401 response and stop
            return res.status(401).json({ error: "User not authenticated" });
        }

        const verifyToken = jwt.verify(token, secretKey);
        
        const rootUser = await USER.findOne({ _id: verifyToken._id, "tokens.token": token });
        
        if (!rootUser) { 
            throw new Error("User not found");
        }

        req.token = token;
        req.rootUser = rootUser;
        req.userID = rootUser._id;

        next(); // Proceed to the next middleware/route handler

    } catch (error) {
        return res.status(401).json({ error: "Unauthorized: Token is invalid" });
    }
}

module.exports = athenticate;