import express from 'express';
import {
  createInitialAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

router.post('/create-initial', createInitialAdmin);
router.post('/login', loginAdmin);
router.get('/me', protectAdmin, getAdminProfile);
router.put('/update', protectAdmin, updateAdminProfile);

export default router;