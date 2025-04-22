import { mockLogin, mockVerifyToken } from "./mockAuth";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface TokenVerificationResponse {
  valid: boolean;
  email: string;
}

const API_URL = "/api/auth";

// Flag to use mock auth during development
const USE_MOCK_AUTH = false;

/**
 * Authenticate a user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<string> {
  try {
    console.log("API_URL:", API_URL);
    console.log("Full URL:", `${API_URL}/login`);

    let data: LoginResponse;

    if (USE_MOCK_AUTH) {
      // Use mock implementation for development
      data = await mockLogin(credentials.email, credentials.password);
    } else {
      // Use actual API
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      data = await response.json();
    }

    // Store the token in localStorage for persistence across page refreshes
    localStorage.setItem("auth_token", data.access_token);

    return data.access_token;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Log the user out by removing the auth token
 */
export function logout(): void {
  localStorage.removeItem("auth_token");
}

/**
 * Verify if the current token is valid
 */
export async function verifyToken(
  token: string
): Promise<TokenVerificationResponse> {
  try {
    let result: TokenVerificationResponse;

    if (USE_MOCK_AUTH) {
      // Use mock implementation for development
      result = await mockVerifyToken(token);
    } else {
      // Use actual API
      const response = await fetch(`${API_URL}/verify-token?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Token verification failed");
      }

      result = await response.json();
    }

    return result;
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
}

/**
 * Get the current auth token from storage
 */
export function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}
