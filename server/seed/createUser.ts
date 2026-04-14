import bcrypt from 'bcryptjs';
import { getPool } from '../config/database.js';

const [username, password, role = 'admin'] = process.argv.slice(2);

if (!username || !password) {
  console.error('Usage: npm run create-user -- <username> <password> [role]');
  process.exit(1);
}

const pool = getPool();

try {
  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)`,
    [username, hash, role]
  );

  console.log(`✓ User "${username}" created with role "${role}".`);
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('✗ Failed to create user:', msg);
  process.exit(1);
} finally {
  await pool.end();
}