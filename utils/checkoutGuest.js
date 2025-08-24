import Guest from "../models/Guest.js";
import Invoice from "../models/Invoice.js";

export const checkoutGuest = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.id,
      hotelOwner: req.user._id,
    });

    if (!guest) return res.status(404).json({ message: "Guest not found" });

    // Update guest status
    guest.status = "checked out";
    await guest.save();

    // Create invoice snapshot
    const invoice = await Invoice.create({
      guest: guest._id,
      hotelOwner: req.user._id,
      name: guest.name,
      room: guest.room,
      checkInDate: guest.checkInDate,
      checkOutDate: guest.checkOutDate,
      usage: guest.usage,
      billing: guest.billing,
    });

    res.json({ message: "Guest checked out, invoice generated", invoice });
  } catch (err) {
    console.error("Error in checkoutGuest:", err.message);
    res.status(500).json({ message: "Checkout failed" });
  }
};
