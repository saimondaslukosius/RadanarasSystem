/**
 * One-time password migration script.
 * Converts plain-text `password` fields → bcrypt `passwordHash`.
 *
 * Run from backend/: node scripts/migrate-passwords.js
 * Safe to re-run: skips users that already have passwordHash.
 */

const fs      = require('fs');
const path    = require('path');
const bcrypt  = require('bcryptjs');

const SALT_ROUNDS = 10;
const usersFile   = path.join(__dirname, '..', 'data', 'users.json');

const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
let migrated = 0;
let skipped  = 0;

const updated = users.map(user => {
  if (user.passwordHash) {
    console.log(`  SKIP  ${user.email} (passwordHash already exists)`);
    skipped++;
    return user;
  }
  if (!user.password) {
    console.log(`  WARN  ${user.email} (no password field — skipped)`);
    skipped++;
    return user;
  }
  const hash = bcrypt.hashSync(user.password, SALT_ROUNDS);
  const { password, ...rest } = user;
  console.log(`  HASH  ${user.email} → bcrypt hash`);
  migrated++;
  return { ...rest, passwordHash: hash };
});

fs.writeFileSync(usersFile, JSON.stringify(updated, null, 2));
console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped.`);
