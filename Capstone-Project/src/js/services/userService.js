import { readSession } from "./authService.js";
import { API_BASE_URL } from "../config/api.js";

function getAuthHeaders() {
  const session = readSession();
  const token = session?.token || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

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

export async function getProfile() {
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getDocs() {
  const response = await fetch(`${API_BASE_URL}/user/docs`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getUseCases() {
  const response = await fetch(`${API_BASE_URL}/user/use-cases`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getTimeline() {
  const response = await fetch(`${API_BASE_URL}/user/timeline`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Get Rules (for team registration filtering)
// Endpoint: GET /group/rules (Auth: Student -> Bearer)
// Response: { message: "...", data: [{ id, use_case_ref, user_attribute, attribute_value, operator, value, is_active }] }
export async function getRules() {
  const url = `${API_BASE_URL}/group/rules`;
  console.log("Fetching rules from:", url);
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  console.log("Rules response status:", response.status);
  const result = await handleResponse(response);
  console.log("Rules response data:", result);
  return result;
}

// Update Profile
// Endpoint: PUT /user/profile
// Body: { name?, learning_path?, university?, learning_group? }
// Note: learning_path hanya bisa diset SEKALI. Jika sudah ada nilainya, tidak bisa diubah lagi.
export async function updateProfile(payload) {
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// End of userService.js
