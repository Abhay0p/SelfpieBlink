import jwt from 'jsonwebtoken';
import { SpAbhay_User } from '../models/SpAbhay_User.js';

export const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET || 'SpAbhay_FallbackSecretKey_123');
    req.user = await SpAbhay_User.findOne({ _id }).select('_id');
    if (!req.user) {
       return res.status(401).json({ error: 'Authorized user not found' });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};
