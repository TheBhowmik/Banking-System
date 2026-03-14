const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
    
    const token = req.cookies.token || req.header.authorization?.split(" ")[1]; // Support for both cookie and header token

    if (!token) {
        return res.status(401).json({ message: "Authentication token is missing." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId); // Fetch user from database to ensure they still exist and to get latest info

        req.user = user; // Attach user object to request(req) for use in further processing in controllers

        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid authentication token." });
    }
}

module.exports = {
    authMiddleware
};