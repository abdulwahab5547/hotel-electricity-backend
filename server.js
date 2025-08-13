import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import hotelOwnerRoutes from './routes/hotelOwnerRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

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

app.use('/api/auth', authRoutes);
app.use('/api/hotel-owner', hotelOwnerRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/admin', adminRoutes);



app.use(errorHandler);

export default app;