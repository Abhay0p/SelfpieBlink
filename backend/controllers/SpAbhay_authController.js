import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SpAbhay_User } from '../models/SpAbhay_User.js';

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET || 'SpAbhay_FallbackSecretKey_123', { expiresIn: '3d' });
};

export const signupUser = async (req, res) => {
  const { email, password, shopName, ownerName, phone, role, location } = req.body;
  const userRole = role === 'customer' ? 'customer' : 'merchant';

  try {
    const exists = await SpAbhay_User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await SpAbhay_User.create({ 
      email, 
      password: hash, 
      shopName: userRole === 'merchant' ? shopName : 'Customer', 
      ownerName: userRole === 'merchant' ? ownerName : 'Customer Name', 
      phone,
      role: userRole,
      location: location || { lat: 0, lng: 0 }
    });
    const token = createToken(user._id);

    res.status(200).json({ email, token, id: user._id, shopName: user.shopName, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  const loginRole = role === 'customer' ? 'customer' : 'merchant';

  try {
    const user = await SpAbhay_User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Incorrect email' });
    if (user.role !== loginRole) return res.status(400).json({ error: `Account registered as ${user.role}, please use the correct portal.` });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });

    const token = createToken(user._id);
    res.status(200).json({ email, token, id: user._id, shopName: user.shopName, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
