import HotelOwner from '../models/HotelOwner.js';
import Guest from '../models/Guest.js';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';
import { getBuildingUsageFromDentcloud } from '../utils/dentcloud.js';


const DENTCLOUD_API = "https://api.dentcloud.io/v1";

export const uploadInvoiceLogo = async (req, res) => {
  try {
    const owner = await HotelOwner.findById(req.user._id);

    if (!owner) {
      return res.status(404).json({ message: "Hotel owner not found" });
    }

    // ✅ Only premium can upload logo
    if (owner.planType !== "premium") {
      return res.status(403).json({ message: "Your plan does not allow logo customization" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer);

    owner.invoiceLogo = imageUrl;
    await owner.save();

    res.json({
      message: "Invoice logo uploaded successfully",
      invoiceLogo: owner.invoiceLogo,
    });
  } catch (error) {
    console.error("🔥 Error in uploading invoice logo:", error.message);
    res.status(500).json({ message: "Failed to upload invoice logo" });
  }
};



// Get all hotel owners
export const getAllHotelOwners = async (req, res) => {
  try {
    const owners = await HotelOwner.find().select('-password');
    res.json(owners);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch hotel owners' });
  }
};

// Get single hotel owner by ID
export const getHotelOwnerById = async (req, res) => {
  try {
    const owner = await HotelOwner.findById(req.params.id).select('-password');
    if (!owner) return res.status(404).json({ message: 'Hotel owner not found' });
    res.json(owner);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hotel owner' });
  }
};

// Create a new hotel owner (admin use)

export const createHotelOwner = async (req, res) => {
  const { firstName, lastName, buildingName, email, password, meterIds, planType } = req.body;

  console.log('📥 Incoming request to create hotel owner:', {
    firstName,
    lastName,
    buildingName,
    email,
    meterIds,
    planType,
  });

  try {
    // Check if hotel owner already exists
    const exists = await HotelOwner.findOne({ email });
    if (exists) {
      console.log('❌ Hotel owner already exists with email:', email);
      return res.status(400).json({ message: 'Hotel owner already exists' });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new hotel owner
    console.log('🛠 Creating new hotel owner...');
    const newOwner = await HotelOwner.create({
      firstName,
      lastName,
      buildingName,
      email,
      password: hashedPassword,
      meterIds: meterIds || [], // default to empty array if not provided
      guests: [], // starts empty
      planType: planType || "basic" // default to basic if not provided
    });

    console.log('✅ Hotel owner created successfully:', newOwner._id);

    res.status(201).json({
      _id: newOwner._id,
      firstName: newOwner.firstName,
      lastName: newOwner.lastName,
      buildingName: newOwner.buildingName,
      email: newOwner.email,
      meterIds: newOwner.meterIds,
      planType: newOwner.planType
    });
  } catch (error) {
    console.error('🔥 Error creating hotel owner:', error.message);
    res.status(500).json({ message: 'Failed to create hotel owner' });
  }
};

  

// Update a hotel owner
// export const updateHotelOwner = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const updated = await HotelOwner.findByIdAndUpdate(id, req.body, {
//       new: true,
//       runValidators: true,
//     }).select('-password');

//     if (!updated) return res.status(404).json({ message: 'Hotel owner not found' });

//     res.json(updated);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update hotel owner' });
//   }
// };

// Self update controller
// export const updateMyProfile = async (req, res) => {
//   try {
//     console.log("📥 Hotel owner self-update request:", req.user._id, req.body);

//     const updated = await HotelOwner.findByIdAndUpdate(
//       req.user._id,
//       { $set: req.body },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!updated) {
//       return res.status(404).json({ message: "Hotel owner not found" });
//     }

//     console.log("✅ Hotel owner updated his own profile:", updated._id);
//     res.json(updated);
//   } catch (error) {
//     console.error("🔥 Error in self-update:", error.message);
//     res.status(500).json({ message: "Failed to update profile" });
//   }
// };


export const updateMyProfile = async (req, res) => {
  try {
    console.log("📥 Hotel owner self-update request:", req.user._id, req.body);

    const owner = await HotelOwner.findById(req.user._id);
    if (!owner) {
      return res.status(404).json({ message: "Hotel owner not found" });
    }

    // ✅ Only premium plan can update email app password settings
    if (
      ("useDefaultAppPassword" in req.body || "customAppPassword" in req.body) &&
      owner.planType !== "premium"
    ) {
      return res
        .status(403)
        .json({ message: "Custom email password is only available for premium plan users" });
    }

    // Prevent exposing customAppPassword back in the response
    const allowedUpdates = { ...req.body };
    delete allowedUpdates.customAppPassword; // still saved, just not sent back in response

    // Update the owner
    if ("useDefaultAppPassword" in req.body) {
      owner.useDefaultAppPassword = req.body.useDefaultAppPassword;
    }
    if ("customAppPassword" in req.body) {
      owner.customAppPassword = req.body.customAppPassword;
    }

    // Update other allowed fields
    Object.assign(owner, allowedUpdates);

    await owner.save();

    console.log("✅ Hotel owner updated his own profile:", owner._id);

    const ownerSafe = owner.toObject();
    delete ownerSafe.password;
    delete ownerSafe.customAppPassword; // hide sensitive field

    res.json(ownerSafe);
  } catch (error) {
    console.error("🔥 Error in self-update:", error.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};





// Admin use
export const updateHotelOwner = async (req, res) => {
  const { id } = req.params;

  try {
    console.log("📥 Incoming update request for hotel owner:", id, req.body);

    // Update hotel owner
    const updated = await HotelOwner.findByIdAndUpdate(
      id,
      { $set: req.body }, 
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updated) {
      console.log("❌ Hotel owner not found:", id);
      return res.status(404).json({ message: "Hotel owner not found" });
    }

    console.log("✅ Hotel owner updated successfully:", updated._id);

    res.json(updated);
  } catch (error) {
    console.error("🔥 Error updating hotel owner:", error.message);
    res.status(500).json({ message: "Failed to update hotel owner" });
  }
};



// Delete a hotel owner
export const deleteHotelOwner = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedOwner = await HotelOwner.findByIdAndDelete(id);

    if (!deletedOwner) {
      return res.status(404).json({ message: 'Hotel owner not found' });
    }

    res.json({ message: 'Hotel owner deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting hotel owner:', error.message);
    res.status(500).json({ message: 'Failed to delete hotel owner' });
  }
};









// Get building usage - for general dashboards

export const getBuildingUsage = async (req, res) => {
  try {
    const { month, year } = req.query;
    const ownerId = req.user._id;

    console.log("📥 Incoming request:", { ownerId, month, year });

    // 1. Load hotel owner
    const hotelOwner = await HotelOwner.findById(ownerId);
    if (!hotelOwner) {
      return res.status(404).json({ message: "Hotel owner not found" });
    }

    // 2. Load guests
    const guests = await Guest.find({ hotelOwner: ownerId });
    if (!guests.length) {
      return res.status(404).json({ message: "No guests found for this owner" });
    }

    const { dentApiKey, dentKeyId } = hotelOwner;
    if (!dentApiKey || !dentKeyId) {
      return res.status(400).json({ message: "DentCloud credentials missing" });
    }

    // 3. Extract guest meter IDs
    const guestMeters = guests.map(g => g.meterID);

    // Group meters by base
    const meterGroups = {};
    guestMeters.forEach(m => {
      const [base, sub] = m.split("_");
      if (!meterGroups[base]) meterGroups[base] = [];
      meterGroups[base].push(sub);
    });

    let topicsMap = {};
    let guestUsageMap = {}; // track usage per guest

    // 4. Fetch data for each base meter
    for (const baseMeter of Object.keys(meterGroups)) {
      const response = await axios.get(DENTCLOUD_API, {
        params: {
          request: "getData",
          year,
          month,
          topics: "[kWHNet]",
          meter: baseMeter,
        },
        headers: {
          "x-api-key": dentApiKey,
          "x-key-id": dentKeyId,
        },
      });

      const { topics } = response.data;

      topics.forEach(row => {
        const key = `${row.date}_${row.time}`;
        if (!topicsMap[key]) {
          topicsMap[key] = { date: row.date, time: row.time };
        }

        meterGroups[baseMeter].forEach(sub => {
          const field = `kWHNet/Elm/${sub}`;
          if (row[field]) {
            const value = parseFloat(row[field]);
            topicsMap[key][field] = value;

            // find guest with this meterID
            const meterID = `${baseMeter}_${sub}`;
            const guest = guests.find(g => g.meterID === meterID);

            if (guest) {
              if (!guestUsageMap[meterID]) {
                guestUsageMap[meterID] = {
                  guestName: guest.name,
                  guestRoom: guest.room,
                  meterID: meterID,
                  totalUsage: 0,
                };
              }
              guestUsageMap[meterID].totalUsage += value;
            }
          }
        });
      });
    }

    const topics = Object.values(topicsMap);

    // 5. Calculate total usage across all guests
    const totalUsage = Object.values(guestUsageMap).reduce(
      (sum, g) => sum + g.totalUsage,
      0
    );

    const roundedTotalUsage = Number(totalUsage.toFixed(3));
    const guestsData = Object.values(guestUsageMap).map(g => ({
      guestName: g.guestName,
      guestRoom: g.guestRoom,
      meterID: g.meterID,
      totalUsage: Number(g.totalUsage.toFixed(3)),
    }));

    return res.json({
      totalUsage: roundedTotalUsage,
      guests: guestsData,
    });
  } catch (error) {
    console.error("❌ Error in getBuildingUsage:", error);
    res.status(500).json({ message: "Server error" });
  }
};
