const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getMyInvoices,
  getAllInvoices,
  payInvoice,
  createInvoice,
} = require("../controllers/invoiceController");

router.get("/my", protect, getMyInvoices);
router.get("/all", protect, adminOnly, getAllInvoices);
router.post("/pay/:id", protect, payInvoice);
router.post("/create", protect, adminOnly, createInvoice);

module.exports = router;
