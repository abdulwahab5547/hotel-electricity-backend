import express from 'express';
import {
  getAllHotelOwners,
  getHotelOwnerById,
  createHotelOwner,
  updateHotelOwner,
  deleteHotelOwner
} from '../controllers/hotelOwnerController.js';

import { protectAdmin } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

router.get('/', getAllHotelOwners);
router.get('/:id', getHotelOwnerById);
router.post('/', createHotelOwner);
router.put('/:id', updateHotelOwner);
router.delete('/:id', deleteHotelOwner);

export default router;