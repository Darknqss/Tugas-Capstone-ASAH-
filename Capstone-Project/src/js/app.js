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
import { DeliverablesPage } from "./components/deliverables.js";
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
  validateGroupRegistration,
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
    try {
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
      // Re-attach form handlers for dynamically loaded forms
      this.attachFormHandlers();
      // Pastikan URL tidak memiliki hash setelah route rendered
      if (window.location.hash) {
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }
      this.updateActiveNavLink();
      // Pastikan nav visibility di-update setelah route rendered
      this.updateNavVisibility();
    });
      // Load route saat init - ini akan handle refresh juga
      // Pastikan DOM sudah ready sebelum load route
      const loadRoute = () => {
        this.router.loadRoute();
        this.updateActiveNavLink();
        this.updateAuthWidgets();
        this.updateNavVisibility();
      };
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadRoute);
      } else {
        // DOM sudah ready, langsung load route
        // Gunakan setTimeout kecil untuk memastikan semua sudah siap
        setTimeout(loadRoute, 0);
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    }
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
    
    // Deliverables route
    this.router.addRoute("/deliverables", DeliverablesPage);
  }

  handleNavigation() {
    // Use event delegation untuk handle semua link dengan data-link
    document.addEventListener("click", (e) => {
      // Cek apakah klik pada link atau elemen di dalam link
      const link = e.target.closest("[data-link]");
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute("href") || "";
        // Normalisasi path: buang "#" jika ada, pastikan ada "/" di depan
        let cleanPath = href.replace(/^#/, "");
        if (cleanPath && !cleanPath.startsWith('/')) {
          cleanPath = '/' + cleanPath;
        }
        // Gunakan router.navigate agar normalisasi path konsisten
        this.router.navigate(cleanPath);
        this.updateActiveNavLink();
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.router.loadRoute();
      this.updateActiveNavLink();
    });
  }

  setupAuthHandlers() {
    // Use event delegation for forms - attach to document for dynamic content
    document.addEventListener("submit", (event) => {
      try {
        const form = event.target;
        if (!form || !form.tagName || form.tagName !== 'FORM') return;
        
        if (form.hasAttribute('data-auth-form')) {
          const formType = form.getAttribute('data-auth-form');
          if (formType === 'login') {
            event.preventDefault();
            event.stopPropagation();
            this.handleLogin(form);
            return;
          }

          if (formType === 'register') {
            event.preventDefault();
            event.stopPropagation();
            this.handleRegister(form);
            return;
          }
        }

        if (form.matches("[data-profile-form]")) {
          event.preventDefault();
          this.handleProfileUpdate(form);
          return;
        }

        if (form.matches("[data-registration-form]")) {
          event.preventDefault();
          this.handleTeamRegistrationSubmit(form);
          return;
        }

        if (form.matches("[data-worksheet-form]")) {
          event.preventDefault();
          this.handleWorksheetSubmit(form);
          return;
        }

        if (form.matches("[data-feedback-form]")) {
          event.preventDefault();
          this.handleFeedbackSubmit(form);
          return;
        }

        if (form.matches("[data-deliverable-form]")) {
          event.preventDefault();
          this.handleDeliverableSubmit(form);
          return;
        }

        // Admin form handlers
        if (form.hasAttribute('data-form')) {
          const formType = form.getAttribute('data-form');
          if (formType === 'create-group') {
            event.preventDefault();
            this.handleCreateGroup(form);
            return;
          }

          if (formType === 'set-rules') {
            event.preventDefault();
            this.handleSetRules(form);
            return;
          }

          if (formType === 'validate-group') {
            event.preventDefault();
            this.handleValidateGroup(form);
            return;
          }

          if (formType === 'validate-worksheet') {
            event.preventDefault();
            this.handleValidateWorksheet(form);
            return;
          }
        }
      } catch (error) {
        console.error("Error handling form submission:", error);
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

      const validateWorksheetBtn = event.target.closest("[data-validate-worksheet]");
      if (validateWorksheetBtn) {
        event.preventDefault();
        const worksheetId = validateWorksheetBtn.dataset.validateWorksheet;
        this.openValidateWorksheetModal(worksheetId);
      }

      const exportFeedbackBtn = event.target.closest("[data-export-feedback]");
      if (exportFeedbackBtn) {
        event.preventDefault();
        this.exportFeedbackData();
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
    const pathname = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      // Normalisasi href: buang "#" jika ada, pastikan ada "/" di depan
      let linkPath = href.replace(/^#/, "");
      if (linkPath && !linkPath.startsWith('/')) {
        linkPath = '/' + linkPath;
      }
      // Handle exact match
      if (linkPath === pathname) {
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
      this.updateNavVisibility();
      this.populateProfileForm();
      this.showToast("Login berhasil 👋");
      setTimeout(() => {
        const session = this.ensureSessionDefaults(readSession());
        const isAdmin = session?.user?.role === "admin";
        const targetPath = isAdmin ? "/admin-dashboard" : "/dashboard";
        this.router.navigate(targetPath);
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
      name: formData.get("full_name")?.trim(), // API uses 'name'
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
      if (nameInput) nameInput.value = session.user.name || session.user.full_name || "";
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
      session.user.name ||
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
        name: newName,
        full_name: newName, // Keep for backward compatibility
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

  async handleTeamRegistrationSubmit(form) {
    event.preventDefault();
    this.resetFormState(form);
    const formData = new FormData(form);
    
    const groupName = formData.get("team_name")?.toString().trim() || "";
    const useCaseSourceId = formData.get("use_case_source_id")?.toString().trim() || "";
    const memberIdsStr = formData.get("member_source_ids")?.toString().trim() || "";
    
    // Parse member IDs from comma-separated string
    const memberSourceIds = memberIdsStr
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (!groupName || !useCaseSourceId || memberSourceIds.length === 0) {
      this.showToast("Lengkapi seluruh field registrasi tim.");
      return;
    }

    const payload = {
      group_name: groupName,
      use_case_source_id: useCaseSourceId,
      member_source_ids: memberSourceIds,
    };

    try {
      this.toggleSubmitLoading(form, true);
      const { registerTeam } = await import("./services/groupService.js");
      const response = await registerTeam(payload);
      this.showToast("Pendaftaran tim berhasil dikirim dan menunggu validasi ✅");
      form.reset();
      this.toggleTeamRegistrationPanel(false);
      // Reload the page to show updated team data
      this.router.loadRoute();
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async handleWorksheetSubmit(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    
    const payload = {
      period_start: formData.get("period_start")?.trim() || "",
      period_end: formData.get("period_end")?.trim() || "",
      activity_description: formData.get("activity_description")?.trim() || "",
      proof_url: formData.get("proof_url")?.trim() || "",
    };

    if (!payload.period_start || !payload.period_end || !payload.activity_description || !payload.proof_url) {
      this.showToast("Lengkapi seluruh field worksheet.");
      return;
    }

    try {
      this.toggleSubmitLoading(form, true);
      const { submitWorksheet } = await import("./services/groupService.js");
      const response = await submitWorksheet(payload);
      this.showToast("Worksheet berhasil dikumpulkan ✅");
      form.reset();
      // Reload the page to show updated worksheet data
      this.router.loadRoute();
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async handleDeliverableSubmit(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    
    const payload = {
      document_type: formData.get("document_type")?.trim() || "",
      file_path: formData.get("file_path")?.trim() || "",
      description: formData.get("description")?.trim() || "",
    };

    if (!payload.document_type || !payload.file_path) {
      this.showToast("Lengkapi jenis dokumen dan URL file.");
      return;
    }

    try {
      this.toggleSubmitLoading(form, true);
      const { submitDeliverable } = await import("./services/groupService.js");
      const response = await submitDeliverable(payload);
      this.showToast("Deliverable berhasil dikumpulkan ✅");
      form.reset();
      // Navigate back to documents page
      this.router.navigate("/dokumen-timeline");
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async handleFeedbackSubmit(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    const revieweeId = form.getAttribute("data-reviewee-id");
    
    if (!revieweeId) {
      this.showToast("ID anggota tidak ditemukan.");
      return;
    }

    const payload = {
      reviewee_source_id: revieweeId,
      is_member_active: formData.get("is_member_active") === "true",
      contribution_level: formData.get("contribution_level")?.trim() || "",
      reason: formData.get("reason")?.trim() || "",
    };

    if (!payload.contribution_level || !payload.reason) {
      this.showToast("Lengkapi tingkat kontribusi dan alasan.");
      return;
    }

    try {
      this.toggleSubmitLoading(form, true);
      const { submitFeedback } = await import("./services/groupService.js");
      const response = await submitFeedback(payload);
      this.showToast("Penilaian berhasil dikirim ✅");
      form.reset();
      // Reload the page to show updated feedback status
      this.router.loadRoute();
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
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

  openValidateWorksheetModal(worksheetId) {
    const modal = document.querySelector('[data-modal="validate-worksheet"]');
    const backdrop = document.querySelector("[data-modal-backdrop]");
    const worksheetIdInput = modal?.querySelector("[data-worksheet-id-input]");

    if (modal && backdrop && worksheetIdInput) {
      worksheetIdInput.value = worksheetId;
      modal.hidden = false;
      backdrop.hidden = false;
    }
  }

  async handleValidateWorksheet(form) {
    this.resetFormState(form);
    const formData = new FormData(form);
    const worksheetId = formData.get("worksheet_id");
    const payload = {
      status: formData.get("status")?.trim() || "",
      feedback: formData.get("feedback")?.trim() || "",
    };

    if (!payload.status) {
      this.showFormFeedback(form, "Status wajib diisi", true);
      return;
    }

    try {
      this.toggleSubmitLoading(form, true);
      const { validateWorksheet } = await import("./services/adminService.js");
      await validateWorksheet(worksheetId, payload);
      this.showToast("Worksheet berhasil divalidasi ✅");
      this.closeModal();
      form.reset();
      this.router.loadRoute();
    } catch (error) {
      this.applyApiErrors(form, error);
    } finally {
      this.toggleSubmitLoading(form, false);
    }
  }

  async exportFeedbackData() {
    try {
      const { exportFeedbackData } = await import("./services/adminService.js");
      const response = await exportFeedbackData();
      const data = response?.data || [];
      
      // Convert to CSV
      if (data.length === 0) {
        this.showToast("Tidak ada data feedback untuk diekspor");
        return;
      }

      const headers = ["Reviewer", "Reviewee", "Nama Tim", "Kontribusi", "Alasan"];
      const rows = data.map(fb => [
        fb.reviewer_name || 'N/A',
        fb.reviewee_name || 'N/A',
        fb.group_name || 'N/A',
        fb.contribution || 'N/A',
        fb.reason || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showToast("Data feedback berhasil diekspor ✅");
    } catch (error) {
      this.showToast("Gagal mengekspor data feedback");
      console.error("Error exporting feedback:", error);
    }
  }

  async filterDeliverables(documentType) {
    try {
      const { listDeliverables } = await import("./services/adminService.js");
      const response = await listDeliverables(documentType || null);
      // Reload page to show filtered results
      this.router.loadRoute();
    } catch (error) {
      console.error("Error filtering deliverables:", error);
    }
  }

  async filterWorksheets(status) {
    try {
      const { listAllWorksheets } = await import("./services/adminService.js");
      const response = await listAllWorksheets(status || null);
      // Reload page to show filtered results
      this.router.loadRoute();
    } catch (error) {
      console.error("Error filtering worksheets:", error);
    }
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
    // Gunakan search params dari pathname, bukan hash
    const urlParams = new URLSearchParams(window.location.search);
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

  attachFormHandlers() {
    // Ensure form handlers are attached to newly rendered forms
    const loginForm = document.querySelector('[data-auth-form="login"]');
    const registerForm = document.querySelector('[data-auth-form="register"]');
    
    if (loginForm && !loginForm.dataset.handlerAttached) {
      loginForm.dataset.handlerAttached = 'true';
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleLogin(loginForm);
      });
    }
    
    if (registerForm && !registerForm.dataset.handlerAttached) {
      registerForm.dataset.handlerAttached = 'true';
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleRegister(registerForm);
      });
    }
  }
}

// Start the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
});