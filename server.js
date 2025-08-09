// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import hotelOwnerRoutes from './routes/hotelOwnerRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();
await connectDB();

const app = express();
app.use(express.json());

app.use(cors({ origin: '*' }));

// ✅ Test route
app.get('/', (req, res) => {
  res.send('Backend is running successfully!');
});

app.use('/api/auth', authRoutes);
app.use('/api/hotel-owner', hotelOwnerRoutes);
app.use('/api/guests', guestRoutes);

app.use(errorHandler);

export default app; // 👈 Instead of app.listen()


// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));