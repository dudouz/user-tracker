export function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random string of at least 32 characters in .env",
    );
  }
  return new TextEncoder().encode(secret);
}
