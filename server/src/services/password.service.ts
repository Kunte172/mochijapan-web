import bcrypt from 'bcrypt';

import { AppError } from '../utils/app-error.js';

const BCRYPT_ROUNDS = 12;
const BCRYPT_MAX_BYTES = 72;

export async function hashPassword(password: string) {
  if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
    throw new AppError(
      400,
      'PASSWORD_TOO_LONG',
      'Password is too long for bcrypt.',
    );
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}
