import express from 'express';
import {
  getAllHotelOwners,
  getHotelOwnerById,
  createHotelOwner,
  updateHotelOwner,
  deleteHotelOwner
} from '../controllers/hotelOwnerController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Example: You can add protect middleware if only admins should use these
router.get('/', getAllHotelOwners);
router.get('/:id', getHotelOwnerById);
router.post('/', createHotelOwner);
router.put('/:id', updateHotelOwner);
router.delete('/:id', deleteHotelOwner);

export default router;
