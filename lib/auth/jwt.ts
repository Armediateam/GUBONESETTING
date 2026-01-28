import jwt from "jsonwebtoken"

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

export const signToken = (payload: TokenPayload, expiresIn = "7d") => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload
}
