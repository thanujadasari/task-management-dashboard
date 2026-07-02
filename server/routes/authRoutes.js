const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getUserProfile);

module.exports = router;