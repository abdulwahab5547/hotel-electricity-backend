import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
  hotelOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelOwner', 
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String
  },
  room: {
    type: String,
    required: true
  },
  meterID: {
    type: String,  
    required: true,  
    trim: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  usage: {
    type: Number, 
    default: 0
  },
  billing: {
    type: Number, 
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'checked out'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Guest = mongoose.model('Guest', guestSchema);
export default Guest;





// import mongoose from 'mongoose';

// const guestSchema = new mongoose.Schema({
//   hotelOwner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'HotelOwner', 
//     required: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     trim: true
//   },
//   contactNumber: {
//     type: String
//   },
//   room: {
//     type: String,
//     required: true
//   },
//   checkInDate: {
//     type: Date,
//     required: true
//   },
//   checkOutDate: {
//     type: Date,
//     required: true
//   },
//   usage: {
//     type: Number, 
//     default: 0
//   },
//   billing: {
//     type: Number, 
//     default: 0
//   },
//   status: {
//     type: String,
//     enum: ['active', 'checked out'],
//     default: 'active'
//   }
// }, {
//   timestamps: true
// });

// const Guest = mongoose.model('Guest', guestSchema);
// export default Guest;