import Guest from '../models/Guest.js';
import { checkoutGuest } from '../utils/checkoutGuest.js';
import { getMetersFromDentcloud } from '../utils/dentcloud.js';
import Invoice from '../models/Invoice.js';
import HotelOwner from '../models/HotelOwner.js';
import { emailInvoice } from '../utils/emailInvoice.js';

// export const getMeters = async (req, res) => {
//   try {
//     const dentResponse = await getMetersFromDentcloud();

//     const meters = dentResponse;

//     res.status(200).json({ success: true, meters });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const getMeters = async (req, res) => {
  try {
    // 🔑 Find the hotel owner making this request
    const owner = await HotelOwner.findById(req.user._id);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Hotel owner not found" });
    }

    if (!owner.dentApiKey || !owner.dentKeyId) {
      return res.status(400).json({ success: false, message: "Dent API credentials not set for this owner" });
    }

    const dentResponse = await getMetersFromDentcloud(owner.dentApiKey, owner.dentKeyId);

    res.status(200).json({ success: true, meters: dentResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




export const getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findOne({
      _id: req.params.id,
      hotelOwner: req.user._id,
    });

    if (!guest) return res.status(404).json({ message: "Guest not found" });

    res.json(guest);
  } catch (error) {
    console.error("Error in getGuestById:", error.message);
    res.status(500).json({ message: "Error fetching guest" });
  }
};

// Get all guests (just return DB values)
// export const getAllGuests = async (req, res) => {
//   try {
//     const guests = await Guest.find({ hotelOwner: req.user._id });
//     res.json(guests);
//   } catch (error) {
//     console.error("Error in getAllGuests:", error.message);
//     res.status(500).json({ message: "Failed to fetch guests" });
//   }
// };

// export const getAllGuests = async (req, res) => {
//   try {
//     const guests = await Guest.find({ hotelOwner: req.user._id });

//     const guestsWithInvoice = await Promise.all(
//       guests.map(async (guest) => {
//         const invoice = await Invoice.findOne({ guest: guest._id })
//           .sort({ createdAt: 1 }) // earliest invoice; use -1 for latest
//           .lean();
//         return { ...guest.toObject(), invoice };
//       })
//     );

//     res.json(guestsWithInvoice);
//   } catch (error) {
//     console.error("Error in getAllGuests:", error.message);
//     res.status(500).json({ message: "Failed to fetch guests" });
//   }
// };



export const getAllGuests = async (req, res) => {
  try {
    // fetch hotel owner details from token
    const hotelOwner = await HotelOwner.findById(req.user._id).lean();
    if (!hotelOwner) {
      return res.status(404).json({ message: "Hotel Owner not found" });
    }

    // get all guests of this hotel owner
    const guests = await Guest.find({ hotelOwner: req.user._id });

    // attach invoice (with hotelOwner info) for each guest
    const guestsWithInvoice = await Promise.all(
      guests.map(async (guest) => {
        let invoice = await Invoice.findOne({ guest: guest._id })
          .sort({ createdAt: 1 }) // earliest invoice; use -1 for latest
          .lean();

        if (invoice) {
          invoice = {
            ...invoice,
            invoiceLogo: hotelOwner.invoiceLogo || null,
            buildingName: hotelOwner.buildingName || null,
          };
        }

        return { ...guest.toObject(), invoice };
      })
    );

    res.json(guestsWithInvoice);
  } catch (error) {
    console.error("Error in getAllGuests:", error.message);
    res.status(500).json({ message: "Failed to fetch guests" });
  }
};


// Create a new guest
export const createGuest = async (req, res) => {
  try {
    const newGuest = await Guest.create({ ...req.body, hotelOwner: req.user._id });
    res.status(201).json(newGuest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create guest' });
  }
};

// Update a guest
export const updateGuest = async (req, res) => {
  try {
    // console.log("➡️ Update request body:", req.body);
    
    const prevGuest = await Guest.findOne({
      _id: req.params.id,
      hotelOwner: req.user._id,
    });

    console.log("👀 Previous guest found:", prevGuest ? prevGuest._id : "none");

    if (!prevGuest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    const updated = await Guest.findOneAndUpdate(
      { _id: req.params.id, hotelOwner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    console.log("✏️ Updated guest:", updated ? updated._id : "none");

    if (!updated) {
      return res.status(404).json({ message: "Guest not found" });
    }

    console.log("🔍 Status check: prev =", prevGuest.status, " new =", updated.status);
    if (
      req.body.status === "checked_out" &&
      prevGuest.status !== "checked_out"
    ) {
      // console.log("⚡ Triggering checkout for guest:", updated._id);
      const invoice = await checkoutGuest(updated);

      const hotelOwner = await HotelOwner.findById(updated.hotelOwner);
      console.log("hotel owner: ", hotelOwner);
      if (hotelOwner.planType === "premium") {
        console.log("finding plan");
        await emailInvoice(invoice, updated, hotelOwner);
      }
      // console.log("✅ Invoice created inside updateGuest:", invoice._id);
    } else {
      // console.log("⏭️ Checkout NOT triggered");
    }

    res.json(updated);
  } catch (error) {
    // console.error("Update Guest Error:", error);
    res.status(500).json({ message: "Failed to update guest" });
  }
};



// Delete a guest
export const deleteGuest = async (req, res) => {
  try {
    const deleted = await Guest.findOneAndDelete({ _id: req.params.id, hotelOwner: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Guest not found' });
    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete guest' });
  }
};
