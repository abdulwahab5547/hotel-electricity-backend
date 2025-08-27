// import Guest from "../models/Guest.js";
import Invoice from "../models/Invoice.js";

export const checkoutGuest = async (guest) => {
    try {
      // Create invoice snapshot
      // console.log("📝 Attempting to create invoice for guest:");
      const invoice = await Invoice.create({
        guest: guest._id,
        hotelOwner: guest.hotelOwner,
        name: guest.name,
        room: guest.room,
        checkInDate: guest.checkInDate,
        checkOutDate: guest.checkOutDate,
        usage: guest.usage,
        billing: guest.billing,
      });
  
      // console.log("✅ Invoice generated for guest:", guest._id, invoice._id);
      return invoice;
    } catch (err) {
      // console.error("❌ Error in checkoutGuest helper:", err.message);
      throw err;
    }
  };