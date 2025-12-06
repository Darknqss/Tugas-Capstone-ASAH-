import { Router } from "./router.js";
import { DashboardPage } from "./components/dashboard.js";
import { TeamInfoPage } from "./components/teamInfo.js";
import { DocumentsPage } from "./components/documents.js";
import { WorksheetPage } from "./components/worksheet.js";
import { FeedbackPage } from "./components/feedback.js";
import { LoginPage } from "./components/login.js";
import { RegisterPage } from "./components/register.js";
import { AdminDashboardPage } from "./components/adminDashboard.js";
import { AdminTeamInfoPage } from "./components/adminTeamInfo.js";
import { AdminDocumentsPage } from "./components/adminDocuments.js";
import { AdminWorksheetPage } from "./components/adminWorksheet.js";
import { AdminFeedbackPage } from "./components/adminFeedback.js";
import { TimelinePage } from "./components/timeline.js";
import {
  clearSession,
  loginRequest,
  logoutRequest,
  persistSession,
  readSession,
  registerRequest,
} from "./services/authService.js";
import {
  createGroup,
  updateGroup,
  validateGroupRegistration,
  updateProjectStatus,
  setGroupRules,
  listAllGroups,
} from "./services/adminService.js";

const TEAM_REGISTRATION_KEY = "capstone-team-registration";

// Initialize the application
class App {
  constructor() {
    this.router = new Router();
    this.toastTimeout = null;
    this.profilePanel = null;
    this.profileBackdrop = null;
    this.pendingRegistrationOpen = false;
    this.init();
  }

  init() {
    this.registerRoutes();
    this.handleNavigation();
    this.setupAuthHandlers();
    this.setupProfilePanel();
    document.addEventListener("capstone:route-rendered", () => {
      this.renderTeamRegistrationSummary();
      this.populateTeamRegistrationForm();
      if (this.pendingRegistrationOpen) {
        this.toggleTeamRegistrationPanel(true);
        this.pendingRegistrationOpen = false;
      }
      // Handle admin team info detail panel
      this.handleAdminTeamInfoDetail();
      // Update navigation visibility based on current route
      this.updateNavVisibility();
    });
    this.router.loadRoute();
    this.updateActiveNavLink();
    this.updateAuthWidgets();
  }

  registerRoutes() {
    // Student routes
    this.router.addRoute("/", DashboardPage);
    this.router.addRoute("/dashboard", DashboardPage);
    this.router.addRoute("/team-information", TeamInfoPage);
    this.router.addRoute("/dokumen-timeline", DocumentsPage);
    this.router.addRoute("/individual-worksheet", WorksheetPage);
    this.router.addRoute("/360-feedback", FeedbackPage);
    this.router.addRoute("/login", LoginPage);
    this.router.addRoute("/register", RegisterPage);
    
    // Admin routes
    this.router.addRoute("/admin-dashboard", AdminDashboardPage);
    this.router.addRoute("/admin-team-information", AdminTeamInfoPage);
    this.router.addRoute("/admin-dokumen-timeline", AdminDocumentsPage);
    this.router.addRoute("/admin-individual-worksheet", AdminWorksheetPage);
    this.router.addRoute("/admin-360-feedback", AdminFeedbackPage);
    
    // Timeline route
    this.router.addRoute("/timeline", TimelinePage);
  }

  handleNavigation() {
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-link]")) {
        e.preventDefault();
        const href = e.target.getAttribute("href") || "";
        const cleanHash = href.replace(/^#/, "");
        // Gunakan router.navigate agar normalisasi path konsisten
        this.router.navigate(cleanHash);
        this.updateActiveNavLink();
      }
    });

    window.addEventListener("popstate", () => {
      this.router.loadRoute();
      this.updateActiveNavLink();
    });

    window.addEventListener("hashchange", () => {
      this.router.loadRoute();
      this.updateActiveNavLink();
    });
  }

  setupAuthHandlers() {
    document.addEventListener("submit", (event) => {
      const form = event.target;
      if (form.matches('[data-auth-form="login"]')) {
        event.preventDefault();
        this.handleLogin(form);
      }

      if (form.matches('[data-auth-form="register"]')) {
        event.preventDefault();
        this.handleRegister(form);
      }

      if (form.matches("[data-profile-form]")) {
        event.preventDefault();
        this.handleProfileUpdate(form);
      }

      if (form.matches("[data-registration-form]")) {
        event.preventDefault();
        this.handleTeamRegistrationSubmit(form);
      }

      // Admin form handlers
      if (form.matches('[data-form="create-group"]')) {
        event.preventDefault();
        this.handleCreateGroup(form);
      }

      if (form.matches('[data-form="set-rules"]')) {
        event.preventDefault();
        this.handleSetRules(form);
      }

      if (form.matches('[data-form="validate-group"]')) {
        event.preventDefault();
        this.handleValidateGroup(form);
      }
    });

    document.addEventListener("click", async (event) => {
      if (event.target.closest("[data-logout-button]")) {
        event.preventDefault();
        await this.handleLogout();
      }

      const registrationToggle = event.target.closest(
        "[data-registration-toggle]",
      );
      if (registrationToggle) {
        event.preventDefault();
        const panel = document.querySelector("[data-registration-panel]");
        if (panel) {
          this.toggleTeamRegistrationPanel(true);
        } else {
          this.pendingRegistrationOpen = true;
          this.router.navigate("team-information");
        }
      }

      // Admin action handlers
      const adminAction = event.target.closest("[data-admin-action]");
      if (adminAction) {
        event.preventDefault();
        const action = adminAction.dataset.adminAction;
        this.handleAdminAction(action);
      }

      const viewGroup = event.target.closest("[data-view-group]");
      if (viewGroup) {
        event.preventDefault();
        const groupId = viewGroup.dataset.viewGroup;
        this.viewGroupDetail(groupId);
      }

      const validateGroupBtn = event.target.closest("[data-validate-group]");
      if (validateGroupBtn) {
        event.preventDefault();
        const groupId = validateGroupBtn.dataset.validateGroup;
        const status = validateGroupBtn.dataset.validateStatus;
        this.openValidateModal(groupId, status);
      }

      const startProject = event.target.closest("[data-start-project]");
      if (startProject) {
        event.preventDefault();
        const groupId = startProject.dataset.startProject;
        this.handleStartProject(groupId);
      }

      const closeDetail = event.target.closest("[data-close-detail]");
      if (closeDetail) {
        event.preventDefault();
        this.closeGroupDetail();
      }

      const closeModal = event.target.closest("[data-close-modal]");
      if (closeModal) {
        event.preventDefault();
        this.closeModal();
      }

      const modalBackdrop = event.target.closest("[data-modal-backdrop]");
      if (modalBackdrop) {
        event.preventDefault();
        this.closeModal();
      }
    });

    // Handle validate status change
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-validate-status]")) {
        const reasonGroup = document.querySelector(
          "[data-rejection-reason-group]"
        );
        if (reasonGroup) {
          reasonGroup.hidden = event.target.value !== "rejected";
        }
      }

      // Handle search and filter
      if (event.target.matches("[data-search-groups]")) {
        this.handleSearchGroups(event.target.value);
      }

      if (event.target.matches("[data-filter-status]")) {
        this.handleFilterGroups(event.target.value);
      }
    });
  }

  setupProfilePanel() {
    this.profilePanel = document.querySelector("[data-profile-panel]");
    this.profileBackdrop = document.querySelector("[data-profile-backdrop]");

    document.addEventListener("click", (event) => {
      const profileTrigger = event.target.closest("[data-profile-trigger]");
      if (profileTrigger) {
        event.preventDefault();
        this.toggleProfilePanel(true);
        return;
      }

      if (
        event.target === this.profileBackdrop ||
        event.target.closest("[data-profile-close]")
      ) {
        this.toggleProfilePanel(false);
        return;
      }

      if (
        this.profilePanel &&
        !this.profilePanel.hidden &&
        !event.target.closest("[data-profile-panel]")
      ) {
        this.toggleProfilePanel(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.toggleProfilePanel(false);
      }
    });

    document.addEventListener("change", (event) => {
      if (
        event.target.matches('input[name="avatar"]') &&
        event.target.closest("[data-profile-form]")
      ) {
        this.syncAvatarCards(
          event.target.closest("[data-profile-form]"),
          event.target.value,
        );
      }
    });
  }

  updateActiveNavLink() {
    const hash = window.location.hash.slice(1) || "dashboard";
    document.querySelectorAll(".nav-link").forEach((link) => {
      const href = link.getAttribute("href").replace("#", "");
      // Handle both exact match and admin routes
      if (href === hash || (hash.startsWith("admin-") && href === hash)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  async handleLogin(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    const payload = {
      email: formData.get("email")?.trim(),
      password: formData.get("password")?.trim(),
    };

    try {
      this.toggleSubmitLoading(form, true);
      const response = await loginRequest(payload);
      const normalizedSession = this.ensureSessionDefaults(response?.data);
      persistSession(normalizedSession);
      this.showFormFeedback(form, "Login berhasil. Mengarahkan ke dashboard.");
      form.reset();
      this.updateAuthWidgets();
      this.populateProfileForm();
      this.showToast("Login berhasil 👋");
      setTimeout(() => {
        const session = this.ensureSessionDefaults(readSession());
        const isAdmin = session?.user?.role === "admin";
        this.router.navigate(isAdmin ? "admin-dashboard" : "dashboard");
      }, 400);
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async handleRegister(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    const payload = {
      full_name: formData.get("full_name")?.trim(),
      email: formData.get("email")?.trim(),
      password: formData.get("password")?.trim(),
      role: formData.get("role") || "student",
    };

    try {
      this.toggleSubmitLoading(form, true);
      await registerRequest(payload);
      this.showFormFeedback(
        form,
        "Pendaftaran berhasil. Silakan masuk menggunakan kredensial Anda.",
      );
      form.reset();
      this.showToast("Akun berhasil dibuat ✅");
      setTimeout(() => {
        this.router.navigate("login");
      }, 500);
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async handleLogout() {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn("Logout gagal:", error);
    } finally {
      clearSession();
      this.updateAuthWidgets();
       this.toggleProfilePanel(false);
      this.showToast("Anda sudah keluar.");
      this.router.navigate("login");
    }
  }

  applyApiErrors(form, error) {
    const details = error?.details;
    const fieldErrors = details?.error?.fields || {};
    const formMessage =
      details?.message || error.message || "Terjadi kesalahan. Coba lagi.";

    Object.entries(fieldErrors).forEach(([field, message]) => {
      const errorElement = form.querySelector(`[data-error="${field}"]`);
      if (errorElement) {
        errorElement.textContent = Array.isArray(message)
          ? message.join(", ")
          : message;
      }
    });

    this.showFormFeedback(form, formMessage, true);
  }

  resetFormState(form) {
    form.querySelectorAll(".form-error").forEach((node) => {
      node.textContent = "";
    });
    const feedback = form.querySelector("[data-form-feedback]");
    if (feedback) {
      feedback.hidden = true;
      feedback.textContent = "";
      feedback.classList.remove("is-error");
    }
  }

  showFormFeedback(form, message, isError = false) {
    const feedback = form.querySelector("[data-form-feedback]");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.classList.toggle("is-error", Boolean(isError));
  }

  toggleSubmitLoading(form, isLoading) {
    const submitButton = form.querySelector('[type="submit"]');
    if (!submitButton) return;
    const originalText =
      submitButton.dataset.submitText || submitButton.textContent;
    if (isLoading) {
      submitButton.dataset.submitText = originalText;
      submitButton.textContent = "Memproses...";
      submitButton.disabled = true;
    } else {
      submitButton.textContent = submitButton.dataset.submitText || "Kirim";
      submitButton.disabled = false;
    }
  }

  updateAuthWidgets() {
    const session = this.ensureSessionDefaults(readSession());
    const guestActions = document.querySelector("[data-guest-actions]");
    const userActions = document.querySelector("[data-user-actions]");
    const emailTarget = document.querySelector("[data-user-email]");
    const displayTarget = document.querySelector("[data-user-display]");
    const avatarTarget = document.querySelector("[data-user-avatar]");
    const profileTrigger = document.querySelector("[data-profile-trigger]");
    const studentNav = document.querySelector("[data-student-nav]");
    const adminNav = document.querySelector("[data-admin-nav]");

    if (session?.user) {
      guestActions?.setAttribute("hidden", "hidden");
      userActions?.removeAttribute("hidden");
      if (emailTarget) emailTarget.textContent = session.user.email || "";
      if (displayTarget)
        displayTarget.textContent =
          session.user.full_name || session.user.email || "";
      if (avatarTarget)
        avatarTarget.textContent = this.getAvatarSymbol(session.user.avatar);
      profileTrigger?.removeAttribute("disabled");

      // Show appropriate navigation based on role
      const isAdmin = session.user.role === "admin";
      if (isAdmin) {
        studentNav?.setAttribute("hidden", "hidden");
        adminNav?.removeAttribute("hidden");
      } else {
        adminNav?.setAttribute("hidden", "hidden");
        studentNav?.removeAttribute("hidden");
      }
    } else {
      userActions?.setAttribute("hidden", "hidden");
      guestActions?.removeAttribute("hidden");
      if (emailTarget) emailTarget.textContent = "";
      if (displayTarget) displayTarget.textContent = "";
      if (avatarTarget) avatarTarget.textContent = "👤";
      profileTrigger?.setAttribute("disabled", "disabled");
      // Hide both navigation menus when logged out
      if (studentNav) studentNav.setAttribute("hidden", "hidden");
      if (adminNav) adminNav.setAttribute("hidden", "hidden");
    }
  }

  showToast(message) {
    const toast = document.getElementById("toast-root");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("toast--visible");

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove("toast--visible");
    }, 2500);
  }

  toggleProfilePanel(shouldOpen) {
    if (!this.profilePanel || !this.profileBackdrop) return;
    if (shouldOpen) {
      this.profilePanel.hidden = false;
      this.profileBackdrop.hidden = false;
      this.populateProfileForm();
    } else {
      this.profilePanel.hidden = true;
      this.profileBackdrop.hidden = true;
    }
  }

  populateProfileForm() {
    const form = this.profilePanel?.querySelector("[data-profile-form]");
    if (!form) return;
    const session = this.ensureSessionDefaults(readSession());
    const nameInput = form.querySelector("[data-profile-name]");
    if (session?.user) {
      if (nameInput) nameInput.value = session.user.full_name || "";
      const avatarValue = session.user.avatar || "male";
      const radio = form.querySelector(
        `input[name="avatar"][value="${avatarValue}"]`,
      );
      if (radio) radio.checked = true;
      this.syncAvatarCards(form, avatarValue);
    } else {
      form.reset();
      if (nameInput) nameInput.value = "";
      this.syncAvatarCards(form, "male");
    }
  }

  syncAvatarCards(form, selectedValue = "male") {
    const cards = form?.querySelectorAll(".avatar-card") || [];
    cards.forEach((card) => {
      const input = card.querySelector('input[name="avatar"]');
      if (!input) return;
      const isSelected = input.value === selectedValue;
      card.classList.toggle("is-selected", isSelected);
      if (isSelected) input.checked = true;
    });
  }

  async handleProfileUpdate(form) {
    const session = this.ensureSessionDefaults(readSession());
    if (!session?.user) {
      this.showToast("Silakan login terlebih dahulu.");
      return;
    }

    const formData = new FormData(form);
    const rawName = formData.get("full_name");
    const newName =
      (typeof rawName === "string" ? rawName.trim() : "") ||
      session.user.full_name ||
      session.user.email;
    const rawAvatar = formData.get("avatar");
    const avatar =
      (typeof rawAvatar === "string" ? rawAvatar : session.user.avatar) ||
      "male";

    const updatedSession = {
      ...session,
      user: {
        ...session.user,
        full_name: newName,
        avatar,
      },
    };

    persistSession(updatedSession);
    this.updateAuthWidgets();
    this.populateProfileForm();
    this.showToast("Profil berhasil diperbarui.");
    this.toggleProfilePanel(false);
    this.router.loadRoute();
  }

  handleTeamRegistrationSubmit(form) {
    const formData = new FormData(form);
    const payload = {
      team_name: formData.get("team_name")?.toString().trim() || "",
      member_id: formData.get("member_id")?.toString().trim() || "",
      learning_path: formData.get("learning_path")?.toString() || "",
      use_case: formData.get("use_case")?.toString() || "",
    };

    if (
      !payload.team_name ||
      !payload.member_id ||
      !payload.learning_path ||
      !payload.use_case
    ) {
      this.showToast("Lengkapi seluruh field registrasi tim.");
      return;
    }

    this.persistTeamRegistration(payload);
    this.renderTeamRegistrationSummary();
    this.populateTeamRegistrationForm();
    this.showToast("Registrasi tim tersimpan.");
    this.toggleTeamRegistrationPanel(true);
  }

  toggleTeamRegistrationPanel(shouldOpen = true) {
    const panel = document.querySelector("[data-registration-panel]");
    if (!panel) return;
    panel.hidden = !shouldOpen;
    if (shouldOpen) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  renderTeamRegistrationSummary() {
    const summary = document.querySelector("[data-registration-summary]");
    const panel = document.querySelector("[data-registration-panel]");
    if (!summary) return;
    const data = this.readTeamRegistration();
    if (!data) {
      summary.hidden = true;
      summary.innerHTML = "";
      return;
    }

    if (panel) panel.hidden = false;
    summary.hidden = false;
    summary.innerHTML = `
      <h3>Tim Terdaftar</h3>
      <ul>
        <li><span>Nama Tim:</span> ${data.team_name}</li>
        <li><span>ID Anggota:</span> ${data.member_id}</li>
        <li><span>Learning Path:</span> ${data.learning_path}</li>
        <li><span>Use Case:</span> ${data.use_case}</li>
      </ul>
    `;
  }

  populateTeamRegistrationForm() {
    const form = document.querySelector("[data-registration-form]");
    const panel = document.querySelector("[data-registration-panel]");
    if (!form) return;
    const data = this.readTeamRegistration();
    if (!data) return;
    if (panel) panel.hidden = false;
    const setValue = (selector, value) => {
      const field = form.querySelector(selector);
      if (field) field.value = value || "";
    };

    setValue('[name="team_name"]', data.team_name);
    setValue('[name="member_id"]', data.member_id);
    setValue('[name="learning_path"]', data.learning_path);
    setValue('[name="use_case"]', data.use_case);
  }

  persistTeamRegistration(data) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TEAM_REGISTRATION_KEY, JSON.stringify(data));
  }

  readTeamRegistration() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(TEAM_REGISTRATION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  ensureSessionDefaults(session) {
    if (!session?.user) return session;
    return {
      ...session,
      user: {
        ...session.user,
        full_name: session.user.full_name || session.user.email || "Pengguna",
        avatar: session.user.avatar || "male",
      },
    };
  }

  getAvatarSymbol(type) {
    if (type === "female") return "👩";
    if (type === "male") return "👨";
    return "👤";
  }

  // Admin handlers
  async handleAdminAction(action) {
    switch (action) {
      case "create-group":
        this.openModal("create-group");
        break;
      case "set-rules":
        this.openModal("set-rules");
        break;
      case "export-data":
        this.handleExportData();
        break;
      case "randomize":
        this.handleRandomize();
        break;
      default:
        console.warn("Unknown admin action:", action);
    }
  }

  openModal(modalName) {
    const modal = document.querySelector(`[data-modal="${modalName}"]`);
    const backdrop = document.querySelector("[data-modal-backdrop]");
    if (modal && backdrop) {
      modal.hidden = false;
      backdrop.hidden = false;
    }
  }

  closeModal() {
    const modals = document.querySelectorAll("[data-modal]");
    const backdrop = document.querySelector("[data-modal-backdrop]");
    modals.forEach((modal) => {
      modal.hidden = true;
    });
    if (backdrop) backdrop.hidden = true;
  }

  async handleCreateGroup(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    const payload = {
      group_name: formData.get("group_name")?.trim(),
      batch_id: formData.get("batch_id")?.trim(),
    };

    try {
      this.toggleSubmitLoading(form, true);
      await createGroup(payload);
      this.showToast("Tim berhasil dibuat ✅");
      this.closeModal();
      form.reset();
      this.router.loadRoute();
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async handleSetRules(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    const payload = {
      batch_id: formData.get("batch_id")?.trim(),
      rules: [
        {
          user_attribute: "learning_path",
          attribute_value: formData.get("learning_path")?.trim(),
          operator: formData.get("operator")?.trim(),
          value: formData.get("value")?.trim(),
        },
      ],
    };

    try {
      this.toggleSubmitLoading(form, true);
      await setGroupRules(payload);
      this.showToast("Aturan komposisi tim berhasil disimpan ✅");
      this.closeModal();
      form.reset();
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  openValidateModal(groupId, status) {
    const modal = document.querySelector('[data-modal="validate-group"]');
    const backdrop = document.querySelector("[data-modal-backdrop]");
    const groupIdInput = modal?.querySelector("[data-group-id-input]");
    const statusSelect = modal?.querySelector("[data-validate-status]");
    const reasonGroup = modal?.querySelector("[data-rejection-reason-group]");

    if (modal && backdrop && groupIdInput && statusSelect) {
      groupIdInput.value = groupId;
      statusSelect.value = status;
      if (reasonGroup) {
        reasonGroup.hidden = status !== "rejected";
      }
      modal.hidden = false;
      backdrop.hidden = false;
    }
  }

  async handleValidateGroup(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    const groupId = formData.get("group_id");
    const status = formData.get("status");
    const payload = {
      status,
    };

    if (status === "rejected") {
      const reason = formData.get("rejection_reason")?.trim();
      if (!reason) {
        this.showFormFeedback(form, "Alasan penolakan wajib diisi", true);
        return;
      }
      payload.rejection_reason = reason;
    }

    try {
      this.toggleSubmitLoading(form, true);
      await validateGroupRegistration(groupId, payload);
      this.showToast(
        `Tim ${status === "accepted" ? "diterima" : "ditolak"} ✅`
      );
      this.closeModal();
      form.reset();
      this.router.loadRoute();
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async handleStartProject(groupId) {
    try {
      await updateProjectStatus(groupId);
      this.showToast("Proyek dimulai ✅");
      this.router.loadRoute();
    } catch (error) {
      this.showToast("Gagal memulai proyek. Coba lagi.");
      console.error("Error starting project:", error);
    }
  }

  async viewGroupDetail(groupId) {
    this.router.navigate(`admin-team-information?groupId=${groupId}`);
  }

  closeGroupDetail() {
    const panel = document.querySelector("[data-group-detail-panel]");
    if (panel) {
      panel.hidden = true;
    }
    this.router.navigate("admin-team-information");
  }

  handleExportData() {
    this.showToast("Fitur ekspor data akan segera tersedia");
  }

  handleRandomize() {
    this.showToast("Fitur randomize peserta akan segera tersedia");
  }

  handleSearchGroups(searchTerm) {
    const rows = document.querySelectorAll("[data-groups-list] tr");
    const term = searchTerm.toLowerCase().trim();
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? "" : "none";
    });
  }

  handleFilterGroups(status) {
    const rows = document.querySelectorAll("[data-groups-list] tr[data-group-id]");
    rows.forEach((row) => {
      if (!status) {
        row.style.display = "";
        return;
      }
      const statusBadge = row.querySelector(`.status-badge--${status}`);
      row.style.display = statusBadge ? "" : "none";
    });
  }

  async handleAdminTeamInfoDetail() {
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const groupId = urlParams.get("groupId");
    if (groupId) {
      // Detail panel should already be rendered by the component
      const panel = document.querySelector("[data-group-detail-panel]");
      if (panel) {
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  updateNavVisibility() {
    const session = this.ensureSessionDefaults(readSession());
    const studentNav = document.querySelector("[data-student-nav]");
    const adminNav = document.querySelector("[data-admin-nav]");

    if (session?.user) {
      const isAdmin = session.user.role === "admin";

      // Show/hide navigation based on role
      if (isAdmin) {
        if (studentNav) studentNav.setAttribute("hidden", "hidden");
        if (adminNav) adminNav.removeAttribute("hidden");
      } else {
        if (adminNav) adminNav.setAttribute("hidden", "hidden");
        if (studentNav) studentNav.removeAttribute("hidden");
      }
    } else {
      // Hide both when logged out
      if (studentNav) studentNav.setAttribute("hidden", "hidden");
      if (adminNav) adminNav.setAttribute("hidden", "hidden");
    }
  }
}

// Start the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
});