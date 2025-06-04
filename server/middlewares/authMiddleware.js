import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";
import { config } from "dotenv";

config();

// Protect routes middleware
export const protect = async (req, res, next) => {
  try {
    // Check for token in headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized, no token" 
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check token expiration
      if (decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({
          success: false,
          message: "Token has expired"
        });
      }

      const userId = decoded.userId;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          success: false,
          message: "Invalid user ID format"
        });
      }

      // Fetch user from DB
      const user = await User.findById(userId).select("-password");

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again."
        });
      }
      throw jwtError;
    }
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authorized, token failed",
      error: error.message
    });
  }
};

// Protect educator routes
export const protectEducator = async (req, res, next) => {
  try {
    // Ensure protect middleware has run
    if (!req.user) {
      console.log("protectEducator: req.user not found"); // ✅ debug
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    console.log("User role:", req.user.role); // ✅ debug

    if (req.user.role !== "educator") {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized as an educator" 
      });
    }

    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: error.message 
    });
  }
};