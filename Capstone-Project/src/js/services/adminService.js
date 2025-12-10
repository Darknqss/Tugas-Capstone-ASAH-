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

// Admin Group Endpoints
export async function listAllGroups() {
  const headers = getAuthHeaders();
  console.log("[listAllGroups] Fetching from:", `${API_BASE_URL}/admin/groups`);
  console.log("[listAllGroups] Headers:", { ...headers, Authorization: headers.Authorization ? "Bearer ***" : "None" });
  
  const response = await fetch(`${API_BASE_URL}/admin/groups`, {
    method: "GET",
    headers: headers,
  });
  
  console.log("[listAllGroups] Response status:", response.status, response.statusText);
  
  const result = await handleResponse(response);
  console.log("[listAllGroups] Response data:", result);
  
  return result;
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

// Admin User Management
export async function updateUserLearningPath(userId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/learning-path`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Update Group
export async function updateAdminGroup(groupId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/groups/${groupId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Update Project Status
export async function updateProjectStatus(groupId) {
  const response = await fetch(`${API_BASE_URL}/admin/groups/${groupId}/start-project`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Get Registration Period Settings
export async function getRegistrationPeriod() {
  const response = await fetch(`${API_BASE_URL}/admin/registration-period`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Set Registration Period
export async function setRegistrationPeriod(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/registration-period`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Export Teams Data
export async function exportTeamsData() {
  const response = await fetch(`${API_BASE_URL}/admin/groups/export`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Get Students Without Team
export async function getStudentsWithoutTeam() {
  const response = await fetch(`${API_BASE_URL}/admin/students/without-team`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Randomize Teams
export async function randomizeTeams(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/groups/randomize`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

// Upload Team Members (Bulk)
export async function uploadTeamMembers(groupId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/groups/${groupId}/members/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

