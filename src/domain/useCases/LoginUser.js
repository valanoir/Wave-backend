import bcrypt from 'bcrypt';

export async function LoginUser(userRepository, email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new Error('User not found');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid password');
  return user;
}