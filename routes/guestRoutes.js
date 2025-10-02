import express from 'express';
import {
  getAllGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  getMeters,
  getGuestUsageByRange,
  getGuestUsageByMonths,
  generateGuestInvoice
} from '../controllers/guestController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes protected — only logged-in hotel owners can access them
router.use(protect);

router.get('/meters', getMeters);
router.get('/:id/usage', getGuestUsageByRange);
router.get('/:id/usage-by-months', getGuestUsageByMonths);
router.get('/:id/invoice', generateGuestInvoice);

router.get('/', getAllGuests);
router.get('/:id', getGuestById);
router.post('/', createGuest);
router.put('/:id', updateGuest);
router.delete('/:id', deleteGuest);

export default router;
