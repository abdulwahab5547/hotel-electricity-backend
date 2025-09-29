import mongoose from 'mongoose';

// const hotelOwnerSchema = new mongoose.Schema({
//   firstName: { type: String, required: true },
//   lastName: { type: String, required: true },
//   buildingName: { type: String, required: true }, 
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   meterIds: [{ type: String }], 
//   guests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }],
//   unitsConsumed: { type: Number },
//   invoiceLogo: { type: String }, 
// }, { timestamps: true });


const hotelOwnerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  buildingName: { type: String, required: true }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  meterIds: [{ type: String }], 
  guests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }],
  unitsConsumed: { type: Number },
  invoiceLogo: { type: String }, 
  planType: { type: String, enum: ["basic", "standard", "premium"], default: "basic" },
  useDefaultAppPassword: { type: Boolean, default: true }, 
  customAppPassword: { type: String, default: null },

  // 🔑 DentCloud credentials
  dentApiKey: { type: String, default: null },
  dentKeyId: { type: String, default: null },
}, { timestamps: true });



const HotelOwner = mongoose.model('HotelOwner', hotelOwnerSchema);

export default HotelOwner;