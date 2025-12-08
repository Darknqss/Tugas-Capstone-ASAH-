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

// Admin Group Endpoints
export async function listAllGroups() {
  const response = await fetch(`${API_BASE_URL}/admin/groups`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function validateGroupRegistration(groupId, payload) {
  const response = await fetch(
    `${API_BASE_URL}/admin/groups/${groupId}/validate`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
}

export async function createGroup(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/groups`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function setGroupRules(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/rules`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Admin Deliverables
export async function listDeliverables(documentType = null) {
  const url = documentType
    ? `${API_BASE_URL}/admin/deliverables?document_type=${documentType}`
    : `${API_BASE_URL}/admin/deliverables`;
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Admin Worksheets
export async function listAllWorksheets(status = null) {
  const url = status
    ? `${API_BASE_URL}/admin/worksheets?status=${status}`
    : `${API_BASE_URL}/admin/worksheets`;
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function validateWorksheet(worksheetId, payload) {
  const response = await fetch(
    `${API_BASE_URL}/admin/worksheets/${worksheetId}/validate`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
}

// Admin Feedback
export async function exportFeedbackData() {
  const response = await fetch(`${API_BASE_URL}/admin/feedback/export`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

