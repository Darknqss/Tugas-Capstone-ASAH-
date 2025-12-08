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

