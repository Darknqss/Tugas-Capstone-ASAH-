const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000/api/auth";
const STORAGE_KEY = "capstone-auth-session";

const defaultHeaders = {
  "Content-Type": "application/json",
};

async function handleResponse(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = { message: "Terjadi kesalahan pada server." };
  }

  if (!response.ok) {
    const error = new Error(payload?.message || "Permintaan gagal.");
    error.details = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function loginRequest(credentials) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
}

export async function registerRequest(payload) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function logoutRequest() {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({}),
  });
  return handleResponse(response);
}

export function persistSession(session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

