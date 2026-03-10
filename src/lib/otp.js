import crypto from "crypto";
import jwt from "jsonwebtoken";

const SECRET = process.env.NEXTAUTH_SECRET;

export function generateToken(email) {
  return jwt.sign({ email, nonce: crypto.randomUUID() }, SECRET, {
    expiresIn: "10m",
  });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    return payload.email || null;
  } catch {
    return null;
  }
}
