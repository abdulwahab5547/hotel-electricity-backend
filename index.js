import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './server.js';
import { scheduleDentSync } from './utils/syncDentJob.js';
// import Guest from './models/Guest.js';

dotenv.config();

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

scheduleDentSync();

// await Guest.updateMany(
//   {}, 
//   { $set: { meterID: "P242409044" } }
// );