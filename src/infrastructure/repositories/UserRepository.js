import mongoose from 'mongoose';
import { TokenModel } from '../../domain/entities/Token.js';

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  bio: String,
  createdAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
});

const UserModel = mongoose.model('User', userSchema);

export class UserRepository {
  async findByEmail(email) {
    return await UserModel.findOne({ email });
  }
  async findByUsername(username) {
    return await UserModel.findOne({ username });
  }
  async createUser(email, username, password, bio, verified = false) {
    const user = new UserModel({ email, username, password, bio, verified });
    await user.save();
    return user;
  }
  async findById(id) {
    return await UserModel.findById(id);
  }
  async setVerified(userId) {
    return await UserModel.findByIdAndUpdate(userId, { verified: true }, { new: true });
  }
  // Token methods
  async createToken(userId, token) {
    const tokenDoc = new TokenModel({ userId, token });
    await tokenDoc.save();
    return tokenDoc;
  }
  async findToken(userId, token) {
    return await TokenModel.findOne({ userId, token });
  }
  async deleteToken(tokenId) {
    return await TokenModel.findByIdAndDelete(tokenId);
  }
}