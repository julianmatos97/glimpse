// This file provides mock implementations of auth endpoints
// to allow development and testing without a backend server

interface User {
  email: string;
  password: string;
}

// Mock user database
const MOCK_USERS: User[] = [
  {
    email: "admin@example.com",
    password: "password",
  },
];

// Delay to simulate network latency
const MOCK_DELAY = 800;

/**
 * Mock login endpoint
 */
export async function mockLogin(
  email: string,
  password: string
): Promise<{ access_token: string; token_type: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

  // Check if user exists and password matches
  const user = MOCK_USERS.find((u) => u.email === email);

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }

  // Generate a fake JWT token (for mock purposes only)
  const token = btoa(
    JSON.stringify({
      sub: email,
      exp: Date.now() + 30 * 60 * 1000, // 30 minutes expiry
    })
  );

  return {
    access_token: token,
    token_type: "bearer",
  };
}

/**
 * Mock token verification endpoint
 */
export async function mockVerifyToken(
  token: string
): Promise<{ valid: boolean; email: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

  try {
    // Decode the token
    const payload = JSON.parse(atob(token));

    // Check if token is expired
    if (payload.exp < Date.now()) {
      return { valid: false, email: "" };
    }

    return { valid: true, email: payload.sub };
  } catch {
    return { valid: false, email: "" };
  }
}
