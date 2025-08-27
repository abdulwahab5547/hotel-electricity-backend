import Guest from '../models/Guest.js';
import { checkoutGuest } from '../utils/checkoutGuest.js';
import { getMetersFromDentcloud } from '../utils/dentcloud.js';


export const getMeters = async (req, res) => {
  try {
    const dentResponse = await getMetersFromDentcloud();

    // Extract meters directly
    const meters = dentResponse.meters || [];

    // TODO: filter assigned meters from DB if needed
    // e.g. const availableMeters = meters.filter(...)

    res.status(200).json({ success: true, meters });
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
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find({ hotelOwner: req.user._id });
    res.json(guests);
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
    const prevGuest = await Guest.findOne({ _id: req.params.id, hotelOwner: req.user._id });
    if (!prevGuest) return res.status(404).json({ message: 'Guest not found' });

    const updated = await Guest.findOneAndUpdate(
      { _id: req.params.id, hotelOwner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Guest not found' });

    // ✅ Trigger checkout function only if status changes to checked_out
    if (req.body.status && req.body.status === 'checked_out' && prevGuest.status !== 'checked_out') {
      await checkoutGuest(updated); // pass updated guest data
    }

    res.json(updated);
  } catch (error) {
    console.error("Update Guest Error:", error);
    res.status(500).json({ message: 'Failed to update guest' });
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
