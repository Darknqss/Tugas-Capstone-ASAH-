import { readSession } from "./authService.js";

const API_BASE_URL = "http://localhost:3000/api";

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
export async function createGroup(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/groups`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateGroup(groupId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/groups/${groupId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

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

export async function updateProjectStatus(groupId) {
  const response = await fetch(`${API_BASE_URL}/admin/project/${groupId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
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

