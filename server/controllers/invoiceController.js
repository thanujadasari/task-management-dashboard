const Invoice = require("../models/Invoice");
const User = require("../models/User");

// Get customer invoices
const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all system invoices (Admin)
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pay an invoice (Customer)
const payInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to pay this invoice" });
    }

    if (invoice.status === "Paid") {
      return res.status(400).json({ message: "Invoice is already paid" });
    }

    // Process mock payment
    invoice.status = "Paid";
    invoice.paidAt = new Date();
    await invoice.save();

    // Activate user subscription
    const user = await User.findById(req.user._id);
    if (user) {
      user.subscription.status = "Active";
      await user.save();
    }

    res.status(200).json({ message: "Payment processed successfully. Subscription activated!", invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a custom test invoice (Admin)
const createInvoice = async (req, res) => {
  try {
    const { userId, planName, amount, status, dueDate } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Target user not found" });
    }

    const invoiceNumber = "INV-" + Math.floor(100000 + Math.random() * 900000);
    const invoice = await Invoice.create({
      invoiceNumber,
      user: userId,
      planName,
      amount,
      status: status || "Unpaid",
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days due
      paidAt: status === "Paid" ? new Date() : null,
    });

    res.status(201).json({ message: "Invoice Created Successfully", invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyInvoices,
  getAllInvoices,
  payInvoice,
  createInvoice,
};
