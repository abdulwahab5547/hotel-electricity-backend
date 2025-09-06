import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import {
  getAllHotelOwners,
  getHotelOwnerById,
  createHotelOwner,
  updateHotelOwner,
  deleteHotelOwner,
  updateMyProfile, 
  uploadInvoiceLogo
} from '../controllers/hotelOwnerController.js';

import { protectAdmin } from '../middleware/adminAuthMiddleware.js';
import { requirePlan } from '../middleware/planMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.put("/me", updateMyProfile);
router.post(
  "/upload-invoice-logo",
  requirePlan(["premium"]),
  upload.single("invoiceLogo"),
  uploadInvoiceLogo
);

// All routes require admin authentication
router.use(protectAdmin);

router.get('/', getAllHotelOwners);
router.get('/:id', getHotelOwnerById);
router.post('/', createHotelOwner);
router.put('/:id', updateHotelOwner);
router.delete('/:id', deleteHotelOwner);

export default router;