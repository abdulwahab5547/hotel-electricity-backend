import HotelOwner from '../models/HotelOwner.js';
import bcrypt from 'bcryptjs';


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
  const { firstName, lastName, buildingName, email, password, meterIds } = req.body;

  console.log('📥 Incoming request to create hotel owner:', {
    firstName,
    lastName,
    buildingName,
    email,
    meterIds,
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
      guests: [] // starts empty
    });

    console.log('✅ Hotel owner created successfully:', newOwner._id);

    res.status(201).json({
      _id: newOwner._id,
      firstName: newOwner.firstName,
      lastName: newOwner.lastName,
      buildingName: newOwner.buildingName,
      email: newOwner.email,
      meterIds: newOwner.meterIds
    });
  } catch (error) {
    console.error('🔥 Error creating hotel owner:', error.message);
    res.status(500).json({ message: 'Failed to create hotel owner' });
  }
};
  

// Update a hotel owner
export const updateHotelOwner = async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await HotelOwner.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updated) return res.status(404).json({ message: 'Hotel owner not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update hotel owner' });
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