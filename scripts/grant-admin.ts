// Grants (or revokes) dashboard access.
//
//   bun run admin:grant you@example.com
//   bun run admin:grant you@example.com --revoke
//
// The account must already exist (register on the storefront first).

import { db } from "../src/prisma/db";

const email = process.argv[2]?.toLowerCase();
const revoke = process.argv.includes("--revoke");
if (!email || email.startsWith("--")) {
  console.error("Usage: bun run admin:grant <email> [--revoke]");
  process.exit(1);
}

const user = await db.orm.public.User.where({ email }).select("id", "role").first();
if (!user) {
  console.error(`No account for ${email}. Register at /register first.`);
  await db.close();
  process.exit(1);
}

await db.orm.public.User.where({ id: user.id }).update({ role: revoke ? "CUSTOMER" : "ADMIN" });
console.log(`${email} is now ${revoke ? "a customer" : "an admin"}. ${revoke ? "" : "Open /admin."}`);
await db.close();
