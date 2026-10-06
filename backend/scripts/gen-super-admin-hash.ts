import { hashPassword } from '../src/lib/password.js';

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Usage: tsx scripts/gen-super-admin-hash.ts <email> <password>');
  process.exit(1);
}

const hash = await hashPassword(password);
console.log(JSON.stringify([{ email, passwordHash: hash }]));
