import HotelOwner from "../models/HotelOwner.js";

export const requirePlan = (allowedPlans) => {
    return async (req, res, next) => {
      try {
        const owner = await HotelOwner.findById(req.user._id);
        if (!owner) return res.status(404).json({ message: "Hotel owner not found" });
  
        if (!allowedPlans.includes(owner.planType)) {
          return res.status(403).json({ message: "Your current plan does not allow this action" });
        }
  
        next();
      } catch (error) {
        console.error("🔥 Plan check failed:", error.message);
        res.status(500).json({ message: "Plan check failed" });
      }
    };
  };