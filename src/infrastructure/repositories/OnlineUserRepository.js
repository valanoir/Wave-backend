import mongoose from 'mongoose';

const onlineUserSchema = new mongoose.Schema({
  userId: String,
  isGuest: Boolean,
  connectedAt: { type: Date, default: Date.now }
});

const OnlineUserModel = mongoose.model('OnlineUser', onlineUserSchema);

export class OnlineUserRepository {
  async addOnlineUser(userId, isGuest) {
    await OnlineUserModel.updateOne(
      { userId },
      { userId, isGuest, connectedAt: new Date() },
      { upsert: true }
    );
  }
  async removeOnlineUser(userId) {
    await OnlineUserModel.deleteOne({ userId });
  }
  async getAllOnlineUsers() {
    return await OnlineUserModel.find();
  }
}