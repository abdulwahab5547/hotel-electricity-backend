import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Guest",
    required: true,
  },
  hotelOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HotelOwner",
    required: true,
  },
  name: { type: String, required: true }, // Guest name snapshot
  room: { type: String, required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },

  usage: { type: Number, required: true },
  billing: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
}, {
  timestamps: true,
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
