import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Hardcoded function to create first admin (run manually once)
export const createInitialAdmin = async (req, res) => {
  try {
    const exists = await Admin.findOne({ email: 'admin@example.com' });
    if (exists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await Admin.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword
    });

    res.status(201).json({ message: 'Initial admin created', adminId: admin._id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
};

// Login admin and return token
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '10d'
    });

    res.json({
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};


// Get logged-in admin details
export const getAdminProfile = async (req, res) => {
    try {
      const admin = await Admin.findById(req.admin.id).select('-password');
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      res.json(admin);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  };
  
  // Update logged-in admin details
  export const updateAdminProfile = async (req, res) => {
    try {
      const admin = await Admin.findById(req.admin.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      admin.firstName = req.body.firstName || admin.firstName;
      admin.lastName = req.body.lastName || admin.lastName;
      admin.email = req.body.email || admin.email;
  
      if (req.body.password) {
        admin.password = await bcrypt.hash(req.body.password, 10);
      }
  
      const updatedAdmin = await admin.save();
      res.json({
        _id: updatedAdmin._id,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        email: updatedAdmin.email
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
  };