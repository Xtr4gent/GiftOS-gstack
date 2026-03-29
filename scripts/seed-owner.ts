import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db, pool } from "../src/db/client";
import { users } from "../src/db/schema";

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    throw new Error("ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set before running the seed.");
  }

  const passwordHash = await hash(password, 12);
  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existing) {
    await db
      .update(users)
      .set({ email: email.toLowerCase(), passwordHash, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    console.log(`Updated owner account for ${username}.`);
    return;
  }

  await db.insert(users).values({
    username,
    email: email.toLowerCase(),
    passwordHash,
  });

  console.log(`Created owner account for ${username}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
