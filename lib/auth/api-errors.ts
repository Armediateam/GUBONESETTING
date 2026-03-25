const matchesError = (error: Error, patterns: RegExp[]) => {
  const text = `${error.name}: ${error.message}`
  return patterns.some((pattern) => pattern.test(text))
}

export const getAuthApiErrorMessage = (
  error: unknown,
  fallback = "Server error",
) => {
  if (!(error instanceof Error)) {
    return fallback
  }

  if (matchesError(error, [/MONGODB_URI is not set/i])) {
    return "Server configuration error: MONGODB_URI is missing"
  }

  if (matchesError(error, [/JWT_SECRET is not set/i])) {
    return "Server configuration error: JWT_SECRET is missing"
  }

  if (matchesError(error, [/USER_PASSWORD_HASH_MISSING/i])) {
    return "Account data is invalid: password hash is missing"
  }

  if (matchesError(error, [/Invalid scheme/i, /connection string/i])) {
    return "Server configuration error: MONGODB_URI is invalid"
  }

  if (
    matchesError(error, [
      /bad auth/i,
      /authentication failed/i,
      /auth failed/i,
    ])
  ) {
    return "MongoDB authentication failed"
  }

  if (
    matchesError(error, [
      /ECONNREFUSED/i,
      /ENOTFOUND/i,
      /timed out/i,
      /failed to connect/i,
      /server selection/i,
      /connection .* closed/i,
    ])
  ) {
    return "MongoDB connection failed"
  }

  return fallback
}
