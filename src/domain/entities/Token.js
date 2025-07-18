import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24 hours
});

export const TokenModel = mongoose.model('Token', tokenSchema); 