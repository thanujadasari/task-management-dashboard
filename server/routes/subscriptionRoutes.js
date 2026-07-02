const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  subscribeToPlan,
  cancelSubscription,
  adminGetSubscriptions,
  adminUpdateSubscription,
} = require("../controllers/subscriptionController");

router.post("/subscribe", protect, subscribeToPlan);
router.post("/cancel", protect, cancelSubscription);
router.get("/admin/users", protect, adminOnly, adminGetSubscriptions);
router.put("/admin/update/:id", protect, adminOnly, adminUpdateSubscription);

module.exports = router;
