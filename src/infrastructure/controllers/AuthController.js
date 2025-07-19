import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { TokenModel } from '../../domain/entities/Token.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('A_GMAIL_USER:', process.env.USER);
console.log('A_GMAIL_PASS:', process.env.PASS ? 'SET' : 'NOT SET');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
});

async function sendVerificationEmail(email, url) {
  console.log('[VERIFICATION URL]', url);
  try {
    const info = await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: 'Verify your email',
      text: `Click here to verify your mail\n${url}`
    });
    console.log('[EMAIL SENT]', info.response);
    return info;
  } catch (err) {
    console.log('[EMAIL ERROR]', err);
    throw err;
  }
}

export function AuthController(userRepository) {
  return {
    register: async (req, res) => {
      try {
        console.log('[REGISTER REQUEST]', req.body);
        const { email, username, password, bio } = req.body;
        if (!email || !username || !password) return res.status(400).json({ message: 'Email, username, and password required' });
        const existing = await userRepository.findByEmail(email);
        if (existing) return res.status(400).json({ message: 'Email already registered' });
        const existingUsername = await userRepository.findByUsername(username);
        if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
        const hashed = await bcrypt.hash(password, 10);
        const user = await userRepository.createUser(email, username, hashed, bio, false); // verified: false
        const token = crypto.randomBytes(32).toString('hex');
        await userRepository.createToken(user._id, token);
        const url = `${process.env.SERVER_URL || 'https://wave-backend-uki2.onrender.com'}/api/verify/${user._id}/${token}`;
        await sendVerificationEmail(email, url);
        res.json({ message: 'Registration successful. Please check your email to verify your account.' });
      } catch (e) {
        console.log('[REGISTER ERROR]', e);
        res.status(400).json({ message: e.message });
      }
    },
    verify: async (req, res) => {
      try {
        const { userId, token } = req.params;
        if (!userId || !token) return res.status(400).send('Invalid verification link.');
        const user = await userRepository.findById(userId);
        if (!user) return res.status(400).send('Invalid link');
        const tokenDoc = await TokenModel.findOne({ userId: user._id, token });
        if (!tokenDoc) return res.status(400).send('Invalid link');
        user.verified = true;
        await user.save();
        await tokenDoc.deleteOne();
        res.send('Email verified successfully. You can now log in.');
      } catch (e) {
        console.log('[VERIFY ERROR]', e);
        res.status(400).send('Verification failed.');
      }
    },
    login: async (req, res) => {
      try {
        console.log('[LOGIN REQUEST]', req.body);
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
        const user = await userRepository.findByEmail(email);
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (!user.verified) return res.status(400).json({ message: 'Email not verified. Please check your email.' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid password' });
        const token = jwt.sign({ id: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const result = { id: user._id, email: user.email, username: user.username, bio: user.bio, isGuest: false, token };
        console.log('[LOGIN RESPONSE]', result);
        res.json(result);
      } catch (e) {
        console.log('[LOGIN ERROR]', e);
        res.status(400).json({ message: e.message });
      }
    },
  };
}