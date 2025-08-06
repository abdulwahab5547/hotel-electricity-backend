import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { signupValidation, loginValidation } from '../validators/authValidator.js';
import { validate } from '../validators/validate.js';

const router = express.Router();

router.post('/signup', signupValidation, validate, signup);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);

router.get('/test', (req, res) => {
    console.log('✅ Test route hit');
    res.json({ message: 'Test route working!' });
  });

export default router;