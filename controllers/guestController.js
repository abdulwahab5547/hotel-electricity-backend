import Guest from '../models/Guest.js';

// Get all guests
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find({ hotelOwner: req.user._id });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch guests' });
  }
};

// Get a single guest by ID
export const getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findOne({ _id: req.params.id, hotelOwner: req.user._id });
    if (!guest) return res.status(404).json({ message: 'Guest not found' });
    res.json(guest);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching guest' });
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
    const updated = await Guest.findOneAndUpdate(
      { _id: req.params.id, hotelOwner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Guest not found' });
    res.json(updated);
  } catch (error) {
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
