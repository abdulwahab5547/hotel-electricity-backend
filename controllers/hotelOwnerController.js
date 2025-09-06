import HotelOwner from '../models/HotelOwner.js';
import bcrypt from 'bcryptjs';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';




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
export const updateMyProfile = async (req, res) => {
  try {
    console.log("📥 Hotel owner self-update request:", req.user._id, req.body);

    const updated = await HotelOwner.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Hotel owner not found" });
    }

    console.log("✅ Hotel owner updated his own profile:", updated._id);
    res.json(updated);
  } catch (error) {
    console.error("🔥 Error in self-update:", error.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

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