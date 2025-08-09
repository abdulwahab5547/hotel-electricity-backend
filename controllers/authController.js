import HotelOwner from '../models/HotelOwner.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

export const signup = async (req, res) => {
  const { firstName, lastName, buildingName, email, password } = req.body;

  try {
    // Check if owner already exists by email
    const existingOwner = await HotelOwner.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({ message: 'Hotel owner already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new hotel owner
    const newOwner = await HotelOwner.create({
      firstName,
      lastName,
      buildingName: buildingName || '', // Optional field
      email,
      password: hashedPassword,
    });

    // Send response with token
    res.status(201).json({
      _id: newOwner._id,
      firstName: newOwner.firstName,
      lastName: newOwner.lastName,
      buildingName: newOwner.buildingName,
      email: newOwner.email,
      token: generateToken(newOwner._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
  
  export const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const owner = await HotelOwner.findOne({ email });
  
      const isPasswordCorrect = owner && await bcrypt.compare(password, owner.password);
  
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      res.json({
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        token: generateToken(owner._id),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};
