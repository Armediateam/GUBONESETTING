import jwt, { type Secret, type SignOptions } from "jsonwebtoken"

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not set")
  }
  return secret
}

type TokenPayload = {
  sub: string
  email: string
}

export const signToken = (
  payload: TokenPayload,
  expiresIn: SignOptions["expiresIn"] = "7d",
) => {
  return jwt.sign(payload, getJwtSecret() as Secret, { expiresIn })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret() as Secret) as TokenPayload
}
