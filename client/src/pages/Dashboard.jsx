import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProfile,
  fetchPlans,
  subscribeToPlan,
  cancelSubscription,
  fetchMyInvoices,
  payInvoice,
  // Admin functions
  fetchAdminSubscriptions,
  updateUserSubscription,
  fetchAllInvoices,
  createPlan,
  updatePlan,
  deletePlan,
  createManualInvoice,
} from "../services/authService";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // overview, plans, invoices, users, plansAdmin
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Customer states
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Admin states
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminInvoices, setAdminInvoices] = useState([]);
  
  // Plan Editor states
  const [planId, setPlanId] = useState("");
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  // Manual Invoice states
  const [targetUserId, setTargetUserId] = useState("");
  const [manualPlanName, setManualPlanName] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualStatus, setManualStatus] = useState("Unpaid");

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const userProfile = await fetchProfile();
      setUser(userProfile);
      setRole(userProfile.role);

      const allPlans = await fetchPlans();
      setPlans(allPlans);

      if (userProfile.role === "admin") {
        setActiveTab("users");
        const usersList = await fetchAdminSubscriptions();
        setAdminUsers(usersList);
        const invList = await fetchAllInvoices();
        setAdminInvoices(invList);
      } else {
        setActiveTab("overview");
        const invList = await fetchMyInvoices();
        setInvoices(invList);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Redirect to login if unauthorized
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    } else {
      loadData();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  /* ==========================================================================
     CUSTOMER HANDLERS
     ========================================================================== */

  // Cancel subscription
  const handleCancelSub = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) return;
    try {
      await cancelSubscription();
      alert("Subscription Canceled successfully.");
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel subscription");
    }
  };

  // Open checkout modal for plan
  const openCheckoutForPlan = (plan) => {
    setCheckoutPlan(plan);
    setCheckoutInvoice(null);
    setShowCheckout(true);
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  };

  // Open checkout modal for pending invoice
  const openCheckoutForInvoice = (invoice) => {
    setCheckoutInvoice(invoice);
    setCheckoutPlan(null);
    setShowCheckout(true);
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  };

  // Submit payment
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (cardNumber.length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
      alert("Please enter valid mock card details.");
      return;
    }

    setPaymentProcessing(true);
    try {
      if (checkoutPlan) {
        // First subscribe (generates invoice)
        const subData = await subscribeToPlan(checkoutPlan._id);
        const invoiceId = subData.invoice?._id;
        
        // If it was a paid plan, now pay that invoice to activate
        if (invoiceId && checkoutPlan.price > 0) {
          await payInvoice(invoiceId);
        }
        alert(`Successfully subscribed to ${checkoutPlan.name}!`);
      } else if (checkoutInvoice) {
        // Pay the pending invoice
        await payInvoice(checkoutInvoice._id);
        alert(`Invoice ${checkoutInvoice.invoiceNumber} paid successfully!`);
      }
      setShowCheckout(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Payment processing failed");
    } finally {
      setPaymentProcessing(false);
    }
  };

  /* ==========================================================================
     ADMIN HANDLERS
     ========================================================================== */

  // Override subscription status/role for user
  const handleUserUpdate = async (userId, status, planId, userRole) => {
    try {
      await updateUserSubscription(userId, {
        role: userRole,
        subscriptionStatus: status,
        planId: planId || undefined,
      });
      alert("User updated successfully");
      const usersList = await fetchAdminSubscriptions();
      setAdminUsers(usersList);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user");
    }
  };

  // Submit plan creation or edit
  const handleSavePlan = async (e) => {
    e.preventDefault();
    const featuresArray = planFeatures.split(",").map((f) => f.trim()).filter((f) => f);
    try {
      if (isEditingPlan) {
        await updatePlan(planId, {
          name: planName,
          price: Number(planPrice),
          features: featuresArray,
          description: planDescription,
        });
        alert("Plan updated successfully");
      } else {
        await createPlan({
          name: planName,
          price: Number(planPrice),
          features: featuresArray,
          description: planDescription,
        });
        alert("Plan created successfully");
      }
      resetPlanForm();
      const allPlans = await fetchPlans();
      setPlans(allPlans);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save plan");
    }
  };

  const handleEditPlanClick = (plan) => {
    setPlanId(plan._id);
    setPlanName(plan.name);
    setPlanPrice(plan.price);
    setPlanFeatures(plan.features.join(", "));
    setPlanDescription(plan.description);
    setIsEditingPlan(true);
    setActiveTab("plansAdmin");
  };

  const handleDeletePlanClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await deletePlan(id);
      alert("Plan deleted successfully");
      const allPlans = await fetchPlans();
      setPlans(allPlans);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete plan");
    }
  };

  const resetPlanForm = () => {
    setPlanId("");
    setPlanName("");
    setPlanPrice("");
    setPlanFeatures("");
    setPlanDescription("");
    setIsEditingPlan(false);
  };

  // Create manual testing invoice
  const handleCreateManualInvoice = async (e) => {
    e.preventDefault();
    if (!targetUserId || !manualPlanName || !manualAmount) {
      alert("Please fill in all manual invoice fields.");
      return;
    }
    try {
      await createManualInvoice({
        userId: targetUserId,
        planName: manualPlanName,
        amount: Number(manualAmount),
        status: manualStatus,
      });
      alert("Manual test invoice generated successfully");
      setTargetUserId("");
      setManualPlanName("");
      setManualAmount("");
      const invList = await fetchAllInvoices();
      setAdminInvoices(invList);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to generate manual invoice");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xl font-semibold">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
          <span>Loading SaaS Dashboard...</span>
        </div>
      </div>
    );
  }

  // Calculated Stats for Admin Dashboard Overview
  const totalRevenue = adminInvoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const activeSubCount = adminUsers.filter(
    (u) => u.subscription?.status === "Active"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Dynamic Glow Accent */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* HEADER NAV */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-lg tracking-wider">
              S
            </span>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              SaaS Billing Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/tasks")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 text-indigo-400 hover:text-indigo-300 font-semibold rounded-lg text-sm transition-all border border-indigo-500/20"
            >
              📋 Go to Tasks Dashboard
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <span className="text-sm text-slate-400 hidden sm:inline">
              Signed in as: <strong className="text-slate-200">{user?.name}</strong> ({role})
            </span>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
        
        {/* STATS OVERVIEW SECTION (ADMIN ONLY) */}
        {role === "admin" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-indigo-500/10 text-6xl font-black">$$</div>
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</h4>
              <p className="text-3xl font-extrabold text-white">${totalRevenue}</p>
              <div className="text-xs text-indigo-400 mt-2">Sum of paid invoices</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-purple-500/10 text-6xl font-black">AS</div>
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Subscriptions</h4>
              <p className="text-3xl font-extrabold text-white">{activeSubCount}</p>
              <div className="text-xs text-purple-400 mt-2">Status: Active users</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-pink-500/10 text-6xl font-black">UR</div>
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Customers</h4>
              <p className="text-3xl font-extrabold text-white">
                {adminUsers.filter((u) => u.role === "customer").length}
              </p>
              <div className="text-xs text-pink-400 mt-2">Excludes administrator accounts</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-emerald-500/10 text-6xl font-black">PL</div>
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Available Plans</h4>
              <p className="text-3xl font-extrabold text-white">{plans.length}</p>
              <div className="text-xs text-emerald-400 mt-2">Configured billing tiers</div>
            </div>
          </div>
        )}

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="border-b border-slate-800 mb-8 flex flex-wrap gap-2">
          {role === "customer" ? (
            <>
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === "plans"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Pricing Plans Grid
              </button>
              <button
                onClick={() => setActiveTab("invoices")}
                className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === "invoices"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                My Invoices History
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === "users"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                User Subscriptions
              </button>
              <button
                onClick={() => setActiveTab("plansAdmin")}
                className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === "plansAdmin"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Plan Manager {isEditingPlan && "(Edit Mode)"}
              </button>
              <button
                onClick={() => setActiveTab("invoicesAdmin")}
                className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === "invoicesAdmin"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                System Invoices
              </button>
            </>
          )}
        </div>

        {/* ==========================================================================
           CUSTOMER: OVERVIEW
           ========================================================================== */}
        {role === "customer" && activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subscription Status Card */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-white">Your Subscription Status</h3>
              
              {user?.subscription?.plan ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-950/50 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Current Active Plan</p>
                      <h4 className="text-2xl font-black text-indigo-400 mt-1">{user.subscription.plan.name}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.subscription.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : user.subscription.status === "Canceled"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                          : "bg-red-500/10 text-red-400 border border-red-500/25"
                      }`}>
                        {user.subscription.status}
                      </span>
                      <p className="text-lg font-bold text-white mt-1">${user.subscription.plan.price} / mo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="p-4 bg-slate-900/30 rounded-xl">
                      <p className="text-slate-400">Subscription Period Start</p>
                      <p className="font-semibold text-white mt-1">
                        {user.subscription.startDate ? new Date(user.subscription.startDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-900/30 rounded-xl">
                      <p className="text-slate-400">Renews/Expires Date</p>
                      <p className="font-semibold text-white mt-1">
                        {user.subscription.endDate ? new Date(user.subscription.endDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    {user.subscription.status !== "Canceled" ? (
                      <button
                        onClick={handleCancelSub}
                        className="px-5 py-2.5 bg-red-900/15 hover:bg-red-900/30 text-red-400 border border-red-500/25 font-semibold rounded-lg text-sm transition-all"
                      >
                        Cancel Active Subscription
                      </button>
                    ) : (
                      <p className="text-amber-400 text-sm italic">
                        Your subscription has been canceled and will terminate at the end of your billing cycle.
                      </p>
                    )}
                    <button
                      onClick={() => setActiveTab("plans")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-md transition-all"
                    >
                      Change Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">💳</div>
                  <h4 className="text-lg font-bold text-slate-200">No active subscription found</h4>
                  <p className="text-slate-400 text-sm mt-2 mb-6 max-w-sm mx-auto">
                    Subscribe to one of our premium plans to activate your account and start managing your workspace features.
                  </p>
                  <button
                    onClick={() => setActiveTab("plans")}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Browse Subscription Plans
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-white font-sans">Quick Support</h3>
              <ul className="space-y-4 text-sm">
                <li className="p-4 bg-slate-950/30 rounded-xl flex items-start gap-3 border border-slate-800/50">
                  <span className="text-indigo-400 text-lg">💡</span>
                  <div>
                    <h5 className="font-bold text-slate-200">How to activate subscription?</h5>
                    <p className="text-slate-400 text-xs mt-1">Generate a subscription via plans page and pay the corresponding invoice in your history.</p>
                  </div>
                </li>
                <li className="p-4 bg-slate-950/30 rounded-xl flex items-start gap-3 border border-slate-800/50">
                  <span className="text-purple-400 text-lg">⚙️</span>
                  <div>
                    <h5 className="font-bold text-slate-200">Need customized tiers?</h5>
                    <p className="text-slate-400 text-xs mt-1">Admins can adjust plan features and pricing in real time via Plan Manager.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ==========================================================================
           CUSTOMER: PLANS GRID
           ========================================================================== */}
        {role === "customer" && activeTab === "plans" && (
          <div>
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h3 className="text-3xl font-extrabold text-white">Find the Perfect Subscription Plan</h3>
              <p className="text-slate-400 mt-3">Select a monthly billing plan that best matches your team sizes and workspace needs. Upgrade or downgrade at any time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isCurrentPlan = user?.subscription?.plan?._id === plan._id;
                return (
                  <div
                    key={plan._id}
                    className={`bg-slate-900/40 border rounded-2xl p-8 shadow-2xl relative flex flex-col justify-between transition-all hover:translate-y-[-4px] ${
                      isCurrentPlan
                        ? "border-indigo-500 bg-gradient-to-b from-indigo-950/20 to-slate-900/40"
                        : "border-slate-800"
                    }`}
                  >
                    {isCurrentPlan && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-black rounded-full uppercase tracking-widest shadow-md">
                        Your Current Plan
                      </span>
                    )}

                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                      <p className="text-slate-400 text-xs min-h-[40px] mb-6">{plan.description}</p>
                      
                      <div className="flex items-baseline gap-1 mb-6 border-b border-slate-800 pb-6">
                        <span className="text-4xl font-black text-white">${plan.price}</span>
                        <span className="text-slate-400 text-sm">/ {plan.billingCycle.toLowerCase()}</span>
                      </div>

                      <ul className="space-y-3.5 mb-8">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                            <span className="text-indigo-400 mt-0.5">✔</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => openCheckoutForPlan(plan)}
                      disabled={isCurrentPlan && user?.subscription?.status === "Active"}
                      className={`w-full py-3 px-4 font-semibold rounded-xl transition-all ${
                        isCurrentPlan
                          ? "bg-slate-800 border border-slate-700 text-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/25"
                      }`}
                    >
                      {isCurrentPlan
                        ? user?.subscription?.status === "Active"
                          ? "Active Plan"
                          : "Pay Invoice to Activate"
                        : "Subscribe Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================================================
           CUSTOMER: MY INVOICES
           ========================================================================== */}
        {role === "customer" && activeTab === "invoices" && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Invoice History & Payments</h3>
              <p className="text-xs text-slate-400 mt-1">Review all generated subscription invoices and billing receipts.</p>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No invoices found in your accounts.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Invoice #</th>
                      <th className="p-4">Billing Plan</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Payment Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-900/20 transition-all">
                        <td className="p-4 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                        <td className="p-4 font-semibold text-white">{inv.planName}</td>
                        <td className="p-4 font-semibold">${inv.amount}</td>
                        <td className="p-4 text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            inv.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-4 text-right">
                          {inv.status === "Unpaid" ? (
                            <button
                              onClick={() => openCheckoutForInvoice(inv)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Paid Receipt</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==========================================================================
           ADMIN: USER SUBSCRIPTIONS
           ========================================================================== */}
        {role === "admin" && activeTab === "users" && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Registered Users & Subscriptions</h3>
              <p className="text-xs text-slate-400 mt-1">Manage global user accounts, override roles, or force change active subscription plans/status.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Active Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Renews On</th>
                    <th className="p-4 text-right">Override Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-900/20 transition-all">
                      <td className="p-4 font-semibold text-white">{u.name}</td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleUserUpdate(u._id, null, null, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-indigo-400 font-semibold">
                        <select
                          value={u.subscription?.plan?._id || ""}
                          onChange={(e) => handleUserUpdate(u._id, null, e.target.value, null)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                        >
                          <option value="">No Active Plan</option>
                          {plans.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.subscription?.status || "Inactive"}
                          onChange={(e) => handleUserUpdate(u._id, e.target.value, null, null)}
                          className={`bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-bold ${
                            u.subscription?.status === "Active"
                              ? "text-emerald-400"
                              : u.subscription?.status === "Canceled"
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Canceled">Canceled</option>
                        </select>
                      </td>
                      <td className="p-4 text-slate-400">
                        {u.subscription?.endDate ? new Date(u.subscription.endDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-slate-500 text-xs">Auto Saved</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================================================
           ADMIN: PLAN MANAGER
           ========================================================================== */}
        {role === "admin" && activeTab === "plansAdmin" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create / Edit Plan Form */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-6">
                {isEditingPlan ? "✏️ Edit Subscription Plan" : "➕ Create Subscription Plan"}
              </h3>
              
              <form onSubmit={handleSavePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Plan Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pro Starter"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Monthly Price ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 29"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Features (comma-separated)</label>
                  <textarea
                    placeholder="Core Dashboard, 24/7 support, SSL Certificate"
                    value={planFeatures}
                    onChange={(e) => setPlanFeatures(e.target.value)}
                    required
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Best choice for small scaling groups."
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-md transition-all"
                  >
                    {isEditingPlan ? "Update Plan" : "Create Plan"}
                  </button>
                  {isEditingPlan && (
                    <button
                      type="button"
                      onClick={resetPlanForm}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-sm transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Configured Plans List */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Configured Subscription Plans</h3>
              </div>

              <div className="divide-y divide-slate-800">
                {plans.map((plan) => (
                  <div key={plan._id} className="p-6 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-900/10 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{plan.name}</h4>
                        <span className="text-xs text-indigo-400 font-mono bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900">
                          ${plan.price} / mo
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">{plan.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {plan.features.map((f, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPlanClick(plan)}
                        className="p-1.5 bg-blue-900/25 hover:bg-blue-900/50 text-blue-400 hover:text-blue-300 text-xs font-bold rounded-lg transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlanClick(plan._id)}
                        className="p-1.5 bg-red-900/25 hover:bg-red-900/50 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
           ADMIN: SYSTEM INVOICES
           ========================================================================== */}
        {role === "admin" && activeTab === "invoicesAdmin" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* System Invoices Table */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Global Billing Invoices</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Invoice #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Plan Name</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Paid On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {adminInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-900/20 transition-all">
                        <td className="p-4 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{inv.user?.name || "—"}</p>
                          <p className="text-slate-400 text-xs">{inv.user?.email || "—"}</p>
                        </td>
                        <td className="p-4 text-slate-300 font-semibold">{inv.planName}</td>
                        <td className="p-4 text-white font-bold">${inv.amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                            inv.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generate Custom Invoice Panel */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-6">➕ Generate Test Invoice</h3>
              
              <form onSubmit={handleCreateManualInvoice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Target Customer</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Target User</option>
                    {adminUsers
                      .filter((u) => u.role === "customer")
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Plan Name / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Startup Plan Overage"
                    value={manualPlanName}
                    onChange={(e) => setManualPlanName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Billing Amount ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Initial Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-md transition-all pt-2"
                >
                  Generate Invoice
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================================================
         CREDIT CARD PAYMENT CHECKOUT MODAL (CUSTOMER)
         ========================================================================== */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-lg">Secure Mock Payment Gateway</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {checkoutPlan ? `Billing Plan: ${checkoutPlan.name}` : `Paying Invoice: ${checkoutInvoice?.invoiceNumber}`}
                </p>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-slate-400 hover:text-white transition-all text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-300">Total Charge Due</span>
                <span className="text-xl font-black text-indigo-400">
                  ${checkoutPlan ? checkoutPlan.price : checkoutInvoice?.amount}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Card Number</label>
                <input
                  type="text"
                  maxLength="16"
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Expiration Date</label>
                  <input
                    type="text"
                    maxLength="5"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">CVV / Security Code</label>
                  <input
                    type="password"
                    maxLength="3"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {paymentProcessing ? "Processing..." : "Complete Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;