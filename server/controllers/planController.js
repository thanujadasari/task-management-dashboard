const Plan = require("../models/Plan");

// Get all plans
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a plan
const createPlan = async (req, res) => {
  try {
    const { name, price, billingCycle, features, description } = req.body;

    const planExists = await Plan.findOne({ name });
    if (planExists) {
      return res.status(400).json({ message: "Plan already exists with this name" });
    }

    const plan = await Plan.create({
      name,
      price,
      billingCycle: billingCycle || "Monthly",
      features: features || [],
      description: description || "",
    });

    res.status(201).json({ message: "Plan Created Successfully", plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a plan
const updatePlan = async (req, res) => {
  try {
    const { name, price, billingCycle, features, description } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { name, price, billingCycle, features, description },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({ message: "Plan Updated Successfully", plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a plan
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({ message: "Plan Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
};
