import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function RegisterUser(userRepository, email, username, password, bio) {
  const existingEmail = await userRepository.findByEmail(email);
  if (existingEmail) throw new Error('Email already registered');
  const existingUsername = await userRepository.findByUsername(username);
  if (existingUsername) throw new Error('Username already taken');
  const hashed = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser(email, username, hashed, bio, false); // verified: false
  const token = crypto.randomBytes(32).toString('hex');
  await userRepository.createToken(user._id, token);
  return { user, token };
}