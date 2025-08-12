import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import hotelOwnerRoutes from './routes/hotelOwnerRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

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
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;