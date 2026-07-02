const User = require("../models/User");
const Plan = require("../models/Plan");
const Invoice = require("../models/Invoice");

// Subscribe to a plan (Customer)
const subscribeToPlan = async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 30-day billing cycle

    // Update user subscription details - status set to Inactive until paid
    // Exception: Free plan is immediately Active
    const isFree = plan.price === 0;
    const initialStatus = isFree ? "Active" : "Inactive";

    user.subscription = {
      plan: plan._id,
      status: initialStatus,
      startDate,
      endDate,
    };
    await user.save();

    // Create corresponding Invoice
    const invoiceNumber = "INV-" + Math.floor(100000 + Math.random() * 900000);
    const invoice = await Invoice.create({
      invoiceNumber,
      user: user._id,
      planName: plan.name,
      amount: plan.price,
      status: isFree ? "Paid" : "Unpaid",
      dueDate: endDate,
      paidAt: isFree ? new Date() : null,
    });

    res.status(200).json({
      message: isFree ? "Subscribed to Free Trial successfully!" : "Subscription requested. Please pay the generated invoice to activate.",
      subscription: user.subscription,
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel subscription (Customer)
const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.subscription.status = "Canceled";
    await user.save();

    res.status(200).json({
      message: "Subscription canceled successfully",
      subscription: user.subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin list all customer subscriptions
const adminGetSubscriptions = async (req, res) => {
  try {
    const users = await User.find().populate("subscription.plan").select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin override a user's subscription / role
const adminUpdateSubscription = async (req, res) => {
  try {
    const { role, subscriptionStatus, planId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role) {
      user.role = role;
    }

    if (subscriptionStatus || planId) {
      if (planId) {
        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ message: "Plan not found" });
        user.subscription.plan = plan._id;
      }
      if (subscriptionStatus) {
        user.subscription.status = subscriptionStatus;
      }
      
      // If setting to active, assign start/end dates if not set
      if (subscriptionStatus === "Active" && !user.subscription.startDate) {
        user.subscription.startDate = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 30);
        user.subscription.endDate = end;
      }
    }

    await user.save();
    const updatedUser = await User.findById(user._id).populate("subscription.plan");
    res.status(200).json({ message: "User settings updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  subscribeToPlan,
  cancelSubscription,
  adminGetSubscriptions,
  adminUpdateSubscription,
};
