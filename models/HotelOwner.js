import mongoose from 'mongoose';

const hotelOwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactName: { type: String },
  accountNumber: { type: String },
  unitNumbers: [{ type: String }],  // e.g. ['Unit A', 'Unit B']
  meterIds: [{ type: String }],     // e.g. ['MID001', 'MID002']
  guests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }],
  role: { type: String, enum: ['hotel', 'admin'], default: 'hotel' }
}, { timestamps: true });

const HotelOwner = mongoose.model('HotelOwner', hotelOwnerSchema);

export default HotelOwner;