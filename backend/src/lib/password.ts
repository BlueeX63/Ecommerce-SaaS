import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** bcrypt only uses the first 72 bytes of its input, so longer passwords are rejected up front. */
export const MAX_PASSWORD_LENGTH = 72;

// A valid bcrypt hash used to keep login timing constant when the account does not exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-password', SALT_ROUNDS);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Performs a bcrypt comparison against a dummy hash so unknown accounts cost the same as known ones. */
export async function fakeCompare(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}

export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { isValid: false, message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.` };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character.' };
  }
  return { isValid: true, message: 'Password is strong.' };
}
