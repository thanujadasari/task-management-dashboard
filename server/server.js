const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const planRoutes = require("./routes/planRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const Plan = require("./models/Plan");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/invoices", invoiceRoutes);

// Seed Default Plans
const seedDefaultPlans = async () => {
  try {
    const count = await Plan.countDocuments();

    if (count === 0) {
      await Plan.insertMany([
        {
          name: "Free Trial",
          price: 0,
          billingCycle: "Monthly",
          features: [
            "Access to core dashboard",
            "1 active team project",
            "7-day trial period",
            "Basic billing details",
          ],
          description:
            "Get started for free and experience the platform with basic features.",
        },
        {
          name: "Startup Professional",
          price: 49,
          billingCycle: "Monthly",
          features: [
            "Full subscription dashboard",
            "Unlimited projects",
            "Up to 5 team members",
            "Email invoice reports",
            "Priority support",
          ],
          description:
            "Perfect for growing startups and small professional teams.",
        },
        {
          name: "Enterprise Elite",
          price: 199,
          billingCycle: "Monthly",
          features: [
            "Full suite access",
            "Unlimited projects and members",
            "24/7 Phone and chat support",
            "Custom billing periods",
            "Dedicated Account Manager",
          ],
          description:
            "Designed for larger enterprises requiring robust compliance and SLA support.",
        },
      ]);

      console.log("🌱 Default billing plans successfully seeded!");
    } else {
      console.log("ℹ️ Default billing plans already exist.");
    }
  } catch (error) {
    console.error("❌ Error seeding default plans:", error);
  }
};

// MongoDB Connection
console.log("Mongo URI:", process.env.MONGO_URI);
console.log("Connecting to MongoDB...");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await seedDefaultPlans();
    console.log("✅ Seed completed");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
  });

// Test Route
app.get("/", (req, res) => {
  res.send("SaaS Billing & Task Management API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});