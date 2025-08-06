import express from 'express';
import {
  getAllGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest
} from '../controllers/guestController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes protected — only logged-in hotel owners can access them
router.use(protect);

router.get('/', getAllGuests);
router.get('/:id', getGuestById);
router.post('/', createGuest);
router.put('/:id', updateGuest);
router.delete('/:id', deleteGuest);

export default router;
