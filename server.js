import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import hotelOwnerRoutes from './routes/hotelOwnerRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import mongoose from 'mongoose';
import express from 'express';
import Guest from './models/Guest.js';






const app = express();
app.use(express.json());
app.use(cors());

// ✅ Test route
app.get('/', (req, res) => {
  res.send('Backend is running successfully!');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await mongoose.connection.db.admin().ping();
    res.json({ message: 'MongoDB is connected', result });
  } catch (err) {
    res.status(500).json({ message: 'MongoDB connection failed', error: err.message });
  }
});



app.get('/generate-invoices', async (req, res) => {
  try {
    const guests = await Guest.find();

    if (!guests.length) {
      return res.status(404).json({ message: "No guests found" });
    }

    // fake invoice generator for now
    const invoices = guests.map((guest) => ({
      guest: guest.name,
      room: guest.room,
      checkIn: guest.checkInDate,
      checkOut: guest.checkOutDate,
      usage: guest.usage,
      billing: guest.billing,
      status: guest.status,
      createdAt: new Date()
    }));

    res.json({ message: "Invoices generated", invoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating invoices", error: err.message });
  }
});


app.use('/api/auth', authRoutes);
app.use('/api/hotel-owner', hotelOwnerRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/admin', adminRoutes);



app.use(errorHandler);

export default app;