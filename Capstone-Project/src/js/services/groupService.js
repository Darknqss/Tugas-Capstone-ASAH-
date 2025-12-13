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
    const text = await response.text();
    console.log("[handleResponse] Raw response text:", text.substring(0, 500)); // Log first 500 chars

    if (text) {
      payload = JSON.parse(text);
    } else {
      payload = {};
    }
  } catch (parseError) {
    console.error("[handleResponse] JSON parse error:", parseError);
    payload = { message: "Terjadi kesalahan pada server." };
  }

  if (!response.ok) {
    console.error("[handleResponse] Response not OK:", {
      status: response.status,
      statusText: response.statusText,
      payload: payload
    });
    const error = new Error(payload?.message || payload?.error || "Permintaan gagal.");
    error.details = payload;
    error.status = response.status;
    throw error;
  }

  console.log("[handleResponse] Success response:", payload);
  return payload;
}

// Team Registration (Student)
export async function registerTeam(payload) {
  console.log("[registerTeam] Sending payload:", payload);
  const response = await fetch(`${API_BASE_URL}/group/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  console.log("[registerTeam] Response status:", response.status);
  return handleResponse(response);
}

// Get My Team (Student)
export async function getMyTeam() {
  const response = await fetch(`${API_BASE_URL}/group/my-team`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Submit Deliverable (Student)
export async function submitDeliverable(payload) {
  const response = await fetch(`${API_BASE_URL}/group/deliverables`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Submit Worksheet (Student)
export async function submitWorksheet(payload) {
  const response = await fetch(`${API_BASE_URL}/group/worksheets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// List My Worksheets (Student)
export async function getMyWorksheets() {
  const response = await fetch(`${API_BASE_URL}/group/worksheets`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Submit Feedback (Student)
export async function submitFeedback(payload) {
  const response = await fetch(`${API_BASE_URL}/group/feedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Get Feedback Status (Student)
export async function getFeedbackStatus() {
  const response = await fetch(`${API_BASE_URL}/group/feedback/status`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Get Worksheet Periods (Student/Public)
export async function getWorksheetPeriods() {
  const response = await fetch(`${API_BASE_URL}/periods`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Note: Student tidak memiliki endpoint untuk list deliverables
// Hanya admin yang bisa list deliverables via GET /api/admin/deliverables

