import Guest from '../models/Guest.js';
import { checkoutGuest } from '../utils/checkoutGuest.js';
import { getMetersFromDentcloud } from '../utils/dentcloud.js';
import Invoice from '../models/Invoice.js';
import HotelOwner from '../models/HotelOwner.js';
import { emailInvoice } from '../utils/emailInvoice.js';
import { generateAndEmailInvoice } from '../utils/invoice.js';
import axios from 'axios';

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



const DENTCLOUD_API = "https://api.dentcloud.io/v1";

function getDateRange(start, end) {
  const dates = [];
  let current = new Date(start);
  const last = new Date(end);

  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Individual guest dashboard - details 
export const getGuestUsageByRange = async (req, res) => {
  try {
    const { id } = req.params; 
    const { startDate, endDate } = req.query;
    const ownerId = req.user._id;

    console.log("📥 Guest usage request:", { id, ownerId, startDate, endDate });

    // 1. Load hotel owner
    const hotelOwner = await HotelOwner.findById(ownerId);
    if (!hotelOwner) return res.status(404).json({ message: "Hotel owner not found" });

    const { dentApiKey, dentKeyId } = hotelOwner;
    if (!dentApiKey || !dentKeyId) {
      return res.status(400).json({ message: "DentCloud credentials missing" });
    }

    // 2. Load guest
    const guest = await Guest.findOne({ _id: id, hotelOwner: ownerId });
    if (!guest) return res.status(404).json({ message: "Guest not found" });

    const { meterID, name, room } = guest;
    const [baseMeter, sub] = meterID.split("_");

    console.log("📡 Guest meter:", { baseMeter, sub });

    // 3. Loop through dates
    const dates = getDateRange(startDate, endDate);
    let totalUsage = 0;
    const usageDetails = [];

    for (const date of dates) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");

      console.log(`🌐 Fetching DentCloud for ${year}-${month}-${day}`);

      const response = await axios.get(DENTCLOUD_API, {
        params: {
          request: "getData",
          year,
          month,
          day,
          topics: "[kWHNet]",
          meter: baseMeter,
        },
        headers: {
          "x-api-key": dentApiKey,
          "x-key-id": dentKeyId,
        },
      });

      const { topics } = response.data;

      if (topics && topics.length > 1) {
        const readings = topics
          .map(row => ({
            date: row.date,
            time: row.time,
            value: parseFloat(row[`kWHNet/Elm/${sub}`])
          }))
          .filter(r => !isNaN(r.value));

        if (readings.length > 1) {
          const first = readings[0];
          const last = readings[readings.length - 1];
          const usage = last.value - first.value;

          totalUsage += usage;
          usageDetails.push({
            date: first.date,
            startTime: first.time,
            endTime: last.time,
            usage: Number(usage.toFixed(3))
          });
        }
      }
    }

    return res.json({
      guestName: name,
      guestRoom: room,
      meterID,
      totalUsage: Number(totalUsage.toFixed(3)),
      usageDetails,
    });

  } catch (error) {
    console.error("❌ Error in getGuestUsageByRange:", error.message);
    if (error.config) {
      console.error("   Axios URL:", error.config.url);
      console.error("   Axios Params:", error.config.params);
    }
    res.status(500).json({ message: "Server error" });
  }
};




export const generateGuestInvoice = async (req, res) => {
  try {
    const { id } = req.params; 
    const { startDate, endDate, costPerKwh } = req.query; // frontend sends in body
    const ownerId = req.user._id;

    console.log("📥 Invoice generation request:", { id, ownerId, startDate, endDate, costPerKwh });

    // 1. Load hotel owner
    const hotelOwner = await HotelOwner.findById(ownerId);
    if (!hotelOwner) return res.status(404).json({ message: "Hotel owner not found" });

    const { dentApiKey, dentKeyId } = hotelOwner;
    if (!dentApiKey || !dentKeyId) {
      return res.status(400).json({ message: "DentCloud credentials missing" });
    }

    // 2. Load guest
    const guest = await Guest.findOne({ _id: id, hotelOwner: ownerId });
    if (!guest) return res.status(404).json({ message: "Guest not found" });

    const { meterID, name, room, email } = guest;
    const [baseMeter, sub] = meterID.split("_");

    // 3. Calculate usage (reuse logic)
    const dates = getDateRange(startDate, endDate);
    let totalUsage = 0;
    const usageDetails = [];

    for (const date of dates) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");

      const response = await axios.get(DENTCLOUD_API, {
        params: {
          request: "getData",
          year,
          month,
          day,
          topics: "[kWHNet]",
          meter: baseMeter,
        },
        headers: {
          "x-api-key": dentApiKey,
          "x-key-id": dentKeyId,
        },
      });

      const { topics } = response.data;

      if (topics && topics.length > 1) {
        const readings = topics
          .map(row => ({
            date: row.date,
            time: row.time,
            value: parseFloat(row[`kWHNet/Elm/${sub}`])
          }))
          .filter(r => !isNaN(r.value));

        if (readings.length > 1) {
          const first = readings[0];
          const last = readings[readings.length - 1];
          const usage = last.value - first.value;

          totalUsage += usage;
          usageDetails.push({
            date: first.date,
            startTime: first.time,
            endTime: last.time,
            usage: Number(usage.toFixed(3)),
            cost: Number((usage * costPerKwh).toFixed(2))
          });
        }
      }
    }

    // 4. Invoice object
    const invoice = {
      guestName: name,
      guestRoom: room,
      guestEmail: email,
      startDate,
      endDate,
      costPerKwh,
      totalUsage: Number(totalUsage.toFixed(3)),
      usageDetails,
      totalCost: Number((totalUsage * costPerKwh).toFixed(2))
    };

    // 5. Send invoice email
    await generateAndEmailInvoice(invoice, guest, hotelOwner);

    return res.json({ message: "Invoice generated and emailed successfully", invoice });

  } catch (error) {
    console.error("❌ Error in generateGuestInvoice:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};




export const getGuestUsageByMonths = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    console.log("📥 Guest monthly usage request:", { id, ownerId });

    // 1. Load hotel owner
    const hotelOwner = await HotelOwner.findById(ownerId);
    if (!hotelOwner) return res.status(404).json({ message: "Hotel owner not found" });

    const { dentApiKey, dentKeyId } = hotelOwner;
    if (!dentApiKey || !dentKeyId) {
      return res.status(400).json({ message: "DentCloud credentials missing" });
    }

    // 2. Load guest
    const guest = await Guest.findOne({ _id: id, hotelOwner: ownerId });
    if (!guest) return res.status(404).json({ message: "Guest not found" });

    const { meterID, name, room } = guest;
    const [baseMeter, sub] = meterID.split("_");

    console.log("📡 Guest meter:", { baseMeter, sub });

    // 🔹 Helper to fetch usage for a given date range
    const fetchUsageForRange = async (startDate, endDate) => {
      const dates = getDateRange(startDate, endDate);
      let totalUsage = 0;

      for (const date of dates) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");

        console.log(`🌐 Fetching DentCloud for ${year}-${month}-${day}`);

        const response = await axios.get(DENTCLOUD_API, {
          params: {
            request: "getData",
            year,
            month,
            day,
            topics: "[kWHNet]",
            meter: baseMeter,
          },
          headers: {
            "x-api-key": dentApiKey,
            "x-key-id": dentKeyId,
          },
        });

        const { topics } = response.data;

        if (topics && topics.length > 1) {
          const readings = topics
            .map(row => ({
              date: row.date,
              time: row.time,
              value: parseFloat(row[`kWHNet/Elm/${sub}`])
            }))
            .filter(r => !isNaN(r.value));

          if (readings.length > 1) {
            const first = readings[0];
            const last = readings[readings.length - 1];
            const usage = last.value - first.value;
            totalUsage += usage;
          }
        }
      }

      return Number(totalUsage.toFixed(3));
    };

    // 🔹 Date ranges for current + last 2 months
    const now = new Date();
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    const firstDayCurrent = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const today = new Date();

    const firstDayLast = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastDayLast = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));

    const firstDayTwoAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
    const lastDayTwoAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 0));

    // 🔹 Fetch usage for each month
    const currentMonthUsage = await fetchUsageForRange(firstDayCurrent, today);
    const lastMonthUsage = await fetchUsageForRange(firstDayLast, lastDayLast);
    const twoMonthsAgoUsage = await fetchUsageForRange(firstDayTwoAgo, lastDayTwoAgo);

    return res.json({
      guestName: name,
      guestRoom: room,
      meterID,
      usage: {
        currentMonth: {
          month: monthNames[now.getUTCMonth()],
          usage: currentMonthUsage
        },
        lastMonth: {
          month: monthNames[firstDayLast.getUTCMonth()],
          usage: lastMonthUsage
        },
        twoMonthsAgo: {
          month: monthNames[firstDayTwoAgo.getUTCMonth()],
          usage: twoMonthsAgoUsage
        }
      }
    });

  } catch (error) {
    console.error("❌ Error in getGuestUsageByMonths:", error.message);
    if (error.config) {
      console.error("   Axios URL:", error.config.url);
      console.error("   Axios Params:", error.config.params);
    }
    res.status(500).json({ message: "Server error" });
  }
};
