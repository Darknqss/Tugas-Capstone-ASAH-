import { Router } from "./router.js";
import { LandingPage } from "./components/landing.js";
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
import { AdminUnassignedPage } from "./components/adminUnassigned.js";
import { TimelinePage } from "./components/timeline.js";
import { DeliverablesPage } from "./components/deliverables.js";
import { TeamRegistrationPage } from "./components/teamRegistration.js";
import {
    clearSession,
    loginRequest,
    logoutRequest,
    persistSession,
    readSession,
    registerRequest,
} from "./services/authService.js";
import {
    getProfile,
    updateProfile,
} from "./services/userService.js";
import {
    createGroup,
    validateGroupRegistration,
    setGroupRules,
    listAllGroups,
    updateAdminGroup,
    updateProjectStatus,
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
        this.autoValidationInterval = null;
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
                // Setup team registration composition validation
                this.setupTeamRegistrationValidation();
                // Setup auto validation if deadline is set
                const deadlineEnabled = localStorage.getItem('worksheet-deadline-enabled') === 'true';
                const deadline = localStorage.getItem('worksheet-deadline');
                if (deadlineEnabled && deadline && window.location.pathname === '/admin-individual-worksheet') {
                    this.setupAutoValidation(deadline);
                }
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
        // Landing page (public)
        this.router.addRoute("/", LandingPage);

        // Auth routes (public)
        this.router.addRoute("/login", LoginPage);
        this.router.addRoute("/register", RegisterPage);

        // Student routes (protected)
        this.router.addRoute("/dashboard", DashboardPage);
        this.router.addRoute("/team-information", TeamInfoPage);
        this.router.addRoute("/team-registration", TeamRegistrationPage);
        this.router.addRoute("/dokumen-timeline", DocumentsPage);
        this.router.addRoute("/individual-worksheet", WorksheetPage);
        this.router.addRoute("/360-feedback", FeedbackPage);

        // Admin routes (protected)
        this.router.addRoute("/admin-dashboard", AdminDashboardPage);
        this.router.addRoute("/admin-team-information", AdminTeamInfoPage);
        this.router.addRoute("/admin-dokumen-timeline", AdminDocumentsPage);
        this.router.addRoute("/admin-individual-worksheet", AdminWorksheetPage);
        this.router.addRoute("/admin-360-feedback", AdminFeedbackPage);
        this.router.addRoute("/admin-unassigned-students", AdminUnassignedPage);

        // Timeline route (protected)
        this.router.addRoute("/timeline", TimelinePage);

        // Deliverables route (protected)
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

                // Admin Forms
                if (form.matches('[data-form="create-group"]')) {
                    event.preventDefault();
                    this.handleCreateGroup(form);
                    return;
                }
                if (form.matches('[data-form="set-rules"]')) {
                    event.preventDefault();
                    this.handleSetRules(form);
                    return;
                }
                if (form.matches('[data-form="validate-group"]')) {
                    event.preventDefault();
                    this.handleValidateGroup(form);
                    return;
                }
                if (form.matches('[data-form="validate-worksheet"]')) {
                    event.preventDefault();
                    this.handleValidateWorksheet(form);
                    return;
                }
                if (form.matches('[data-form="worksheet-deadline"]')) {
                    event.preventDefault();
                    this.handleWorksheetDeadline(form);
                    return;
                }
                if (form.matches('[data-form="edit-member"]')) {
                    event.preventDefault();
                    this.handleUpdateUserLearningPath(form);
                    return;
                }
                if (form.matches('[data-edit-group-form]')) {
                    event.preventDefault();
                    this.handleEditGroup(form);
                    return;
                }
                if (form.matches('[data-edit-member-form]')) {
                    event.preventDefault();
                    this.handleUpdateUserLearningPath(form);
                    return;
                }

                if (form.matches('[data-form="registration-period"]')) {
                    event.preventDefault();
                    this.handleRegistrationPeriod(form);
                    return;
                }
                if (form.matches('[data-form="randomize-teams"]')) {
                    event.preventDefault();
                    this.handleRandomizeTeams(form);
                    return;
                }
                if (form.matches('[data-form="create-period"]')) {
                    event.preventDefault();
                    this.handleCreatePeriod(form);
                    return;
                }
                if (form.matches('[data-form="upload-members"]')) {
                    event.preventDefault();
                    this.handleUploadMembers(form);
                    return;
                }

                if (form.matches('[data-add-member-form]')) {
                    event.preventDefault();
                    this.handleAddMemberSubmit(form);
                    return;
                }

                if (form.matches('[data-form="create-timeline"]')) {
                    event.preventDefault();
                    this.handleCreateTimeline(form);
                    return;
                }

                if (form.matches('[data-form="edit-timeline"]')) {
                    event.preventDefault();
                    this.handleEditTimeline(form);
                    return;
                }



                if (form.matches("[data-registration-form]")) {
                    event.preventDefault();
                    this.handleTeamRegistrationSubmit(form, event);
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

                if (form.matches("[data-randomize-form]")) {
                    event.preventDefault();
                    this.handleRandomizeTeams(form);
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
                // Navigate to new team registration page
                this.router.navigate("/team-registration");
            }


            // Admin action handlers
            const adminAction = event.target.closest("[data-admin-action]");
            if (adminAction) {
                event.preventDefault();
                const action = adminAction.dataset.adminAction;
                this.handleAdminAction(action);
            }

            const viewGroup = event.target.closest("[data-view-group]");
            if (viewGroup && !event.target.closest("button[data-open-edit-group]")) {
                event.preventDefault();
                event.stopPropagation();
                const groupId = viewGroup.dataset.viewGroup;
                console.log("[App] View detail button clicked, groupId:", groupId);
                if (groupId) {
                    this.viewGroupDetail(groupId);
                } else {
                    console.error("[App] No groupId found in view button");
                    this.showToast("ID tim tidak ditemukan");
                }
            }

            const validateGroupBtn = event.target.closest("[data-validate-group]");
            if (validateGroupBtn) {
                event.preventDefault();
                const groupId = validateGroupBtn.dataset.validateGroup;
                const status = validateGroupBtn.dataset.validateStatus;
                this.openValidationModal(groupId, status);
            }

            const editGroupBtn = event.target.closest("[data-edit-group]");
            if (editGroupBtn) {
                event.preventDefault();
                const groupId = editGroupBtn.dataset.editGroup;
                this.openEditGroupModal(groupId);
            }

            const openEditGroupBtn = event.target.closest("[data-open-edit-group]");
            if (openEditGroupBtn) {
                event.preventDefault();
                event.stopPropagation();
                const groupId = openEditGroupBtn.dataset.openEditGroup;
                console.log("[App] Edit button clicked, groupId:", groupId);
                if (groupId) {
                    this.openEditGroupModal(groupId);
                } else {
                    console.error("[App] No groupId found in button");
                    this.showToast("ID tim tidak ditemukan");
                }
            }

            // Handle table row click for viewing group detail (only if not clicking on a button)
            const groupRow = event.target.closest("tr[data-view-group]");
            if (groupRow &&
                !event.target.closest("button") &&
                !event.target.closest("a") &&
                !event.target.closest("[data-view-group]")?.matches("button")) {
                event.preventDefault();
                const groupId = groupRow.dataset.viewGroup || groupRow.dataset.groupId;
                console.log("[App] Row clicked, groupId:", groupId);
                if (groupId) {
                    this.viewGroupDetail(groupId);
                }
            }

            const addRuleBtn = event.target.closest("[data-add-rule]");
            if (addRuleBtn) {
                event.preventDefault();
                this.addRuleField();
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

            const manualValidateAllBtn = event.target.closest("[data-manual-validate-all]");
            if (manualValidateAllBtn) {
                event.preventDefault();
                this.handleManualValidateAll();
            }

            const exportWorksheetsBtn = event.target.closest("[data-export-worksheets]");
            if (exportWorksheetsBtn) {
                event.preventDefault();
                this.exportWorksheetsData();
            }

            const toggleDeadlineSettings = event.target.closest("[data-toggle-deadline-settings]");
            if (toggleDeadlineSettings) {
                event.preventDefault();
                const panel = document.querySelector("[data-deadline-settings-panel]");
                if (panel) {
                    const isHidden = panel.hidden || panel.style.display === 'none';
                    panel.hidden = !isHidden;
                    panel.style.display = isHidden ? 'block' : 'none';
                    toggleDeadlineSettings.textContent = isHidden ? 'Sembunyikan' : 'Tampilkan';
                }
            }

            const cancelDeadlineBtn = event.target.closest("[data-cancel-deadline]");
            if (cancelDeadlineBtn) {
                event.preventDefault();
                const panel = document.querySelector("[data-deadline-settings-panel]");
                if (panel) {
                    panel.hidden = true;
                    panel.style.display = 'none';
                    const toggleBtn = document.querySelector("[data-toggle-deadline-settings]");
                    if (toggleBtn) toggleBtn.textContent = 'Tampilkan';
                }
            }

            const exportFeedbackBtn = event.target.closest("[data-export-feedback]");
            if (exportFeedbackBtn) {
                event.preventDefault();
                this.exportFeedbackData();
            }



            const editMemberBtn = event.target.closest("[data-edit-member]");
            if (editMemberBtn) {
                event.preventDefault();
                const memberId = editMemberBtn.dataset.editMember;
                const groupId = editMemberBtn.dataset.groupId;
                this.openEditMemberModal(groupId, memberId);
            }

            // Randomize Modal Handlers
            const openRandomizeBtn = event.target.closest("[data-open-randomize-modal]");
            if (openRandomizeBtn) {
                event.preventDefault();
                console.log("[App] Randomize button clicked");
                const modal = document.getElementById("randomize-modal");
                if (modal) {
                    console.log("[App] Opening modal");
                    modal.hidden = false;
                    modal.style.display = "flex"; // Force flex
                } else {
                    console.error("[App] Randomize modal not found in DOM");
                }
            }

            if (event.target.matches("[data-close-randomize-modal]") || event.target.closest("[data-close-randomize-modal]")) {
                event.preventDefault();
                const modal = document.getElementById("randomize-modal");
                if (modal) {
                    modal.hidden = true;
                    modal.style.display = "none";
                }
            }

            const uploadMembersBtn = event.target.closest("[data-upload-members]");
            if (uploadMembersBtn) {
                event.preventDefault();
                const groupId = uploadMembersBtn.dataset.uploadMembers;
                this.openUploadMembersModal(groupId);
            }

            // Generic open modal handler
            const openModalBtn = event.target.closest("[data-open-modal]");
            if (openModalBtn) {
                event.preventDefault();
                const modalName = openModalBtn.dataset.openModal;
                const modal = document.querySelector(`.modal[data-modal="${modalName}"]`);
                const backdrop = document.querySelector("[data-modal-backdrop]");

                if (modal && backdrop) {
                    modal.hidden = false;
                    backdrop.hidden = false;
                } else {
                    console.warn(`Modal ${modalName} not found`);
                }
            }
            // Add Member Modal Handlers
            const openAddMemberBtn = event.target.closest("[data-open-add-member]");
            if (openAddMemberBtn) {
                event.preventDefault();
                const groupId = openAddMemberBtn.dataset.openAddMember;
                const modal = document.getElementById("add-member-modal");

                // Ensure the hidden input has the correct group ID
                if (modal) {
                    const form = modal.querySelector('form');
                    if (form) {
                        const groupInput = form.querySelector('[name="group_id"]');
                        if (groupInput) groupInput.value = groupId;
                    }
                    modal.hidden = false;
                    modal.style.display = "flex";
                }
            }

            if (event.target.matches("[data-close-add-member-modal]") || event.target.closest("[data-close-add-member-modal]")) {
                event.preventDefault();
                const modal = document.getElementById("add-member-modal");
                if (modal) {
                    modal.hidden = true;
                    modal.style.display = "none";
                }
            }

            // Remove Member Handler
            const removeMemberBtn = event.target.closest("[data-remove-member]");
            if (removeMemberBtn) {
                event.preventDefault();
                const userId = removeMemberBtn.dataset.removeMember;
                const groupId = removeMemberBtn.dataset.groupId;
                this.handleRemoveMember(groupId, userId);
            }

            // Edit Timeline Handler
            const editTimelineBtn = event.target.closest("[data-edit-timeline]");
            if (editTimelineBtn) {
                event.preventDefault();
                try {
                    const item = JSON.parse(editTimelineBtn.dataset.editTimeline);
                    this.openEditTimelineModal(item);
                } catch (e) {
                    console.error("Failed to parse timeline item data", e);
                }
            }

            // Delete Timeline Handler
            const deleteTimelineBtn = event.target.closest("[data-delete-timeline]");
            if (deleteTimelineBtn) {
                event.preventDefault();
                const id = deleteTimelineBtn.dataset.deleteTimeline;
                if (confirm("Apakah Anda yakin ingin menghapus timeline ini? Aksi ini tidak dapat dibatalkan.")) {
                    this.handleDeleteTimeline(id);
                }
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

            // Handle worksheet filter
            if (event.target.matches("[data-worksheet-filter]")) {
                const status = event.target.value;
                const url = new URL(window.location);
                if (status) {
                    url.searchParams.set('status', status);
                } else {
                    url.searchParams.delete('status');
                }
                window.history.pushState({}, '', url);
                this.router.loadRoute();
            }

            // Handle select all worksheets
            if (event.target.matches("[data-select-all-worksheets]")) {
                const checkboxes = document.querySelectorAll('.worksheet-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = event.target.checked;
                });
            }

            // Edit Member Handler
            const openEditMemberBtn = event.target.closest("[data-edit-member]");
            if (openEditMemberBtn) {
                event.preventDefault();
                const memberId = openEditMemberBtn.dataset.editMember;
                const groupId = openEditMemberBtn.dataset.groupId;
                this.openEditMemberModal(groupId, memberId);
            }

            if (event.target.matches("[data-close-edit-member-modal]") || event.target.closest("[data-close-edit-member-modal]")) {
                event.preventDefault();
                const modal = document.getElementById("edit-member-modal");
                if (modal) {
                    modal.hidden = true;
                    modal.style.display = "none";
                }
            }

            // Handle auto validate enabled checkbox
            if (event.target.matches('[name="auto_validate_enabled"]')) {
                const deadlineInput = document.getElementById('worksheet-deadline-input');
                if (deadlineInput) {
                    deadlineInput.required = event.target.checked;
                }
            }
        });
    }

    setupAdminHandlers() {
        // Setup admin-specific handlers after route renders
    }

    updateNavigationByRole() {
        const session = readSession();
        const userRole = session?.user?.role || "student";
        const studentNav = document.querySelector("[data-student-nav]");
        const adminNav = document.querySelector("[data-admin-nav]");

        if (userRole === "admin") {
            if (studentNav) studentNav.hidden = true;
            if (adminNav) adminNav.hidden = false;
        } else {
            if (studentNav) studentNav.hidden = false;
            if (adminNav) adminNav.hidden = true;
        }
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
            this.showToast("Grup berhasil dibuat ✅");
            form.reset();
            const panel = document.querySelector("[data-create-group-panel]");
            if (panel) panel.hidden = true;
            this.router.loadRoute();
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleEditGroup(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const groupId = formData.get("group_id");
        const payload = {
            group_name: formData.get("group_name")?.trim(),
            batch_id: formData.get("batch_id")?.trim(),
            status: formData.get("status"),
        };

        try {
            this.toggleSubmitLoading(form, true);
            const { updateAdminGroup } = await import("./services/adminService.js");
            await updateAdminGroup(groupId, payload);
            this.showToast("Grup berhasil diperbarui ✅");
            form.reset();
            const panel = document.querySelector("[data-edit-group-panel]");
            if (panel) panel.hidden = true;
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
        const batchId = formData.get("batch_id")?.trim();

        const rules = [];
        const ruleItems = form.querySelectorAll(".rule-item");
        ruleItems.forEach((item) => {
            const userAttribute = item.querySelector('[name="user_attribute"]')?.value;
            const attributeValue = item.querySelector('[name="attribute_value"]')?.value;
            const operator = item.querySelector('[name="operator"]')?.value;
            const value = item.querySelector('[name="value"]')?.value;

            if (userAttribute && attributeValue && operator && value) {
                rules.push({
                    user_attribute: userAttribute,
                    attribute_value: attributeValue,
                    operator: operator,
                    value: value,
                });
            }
        });

        const payload = {
            batch_id: batchId,
            rules: rules,
        };

        try {
            this.toggleSubmitLoading(form, true);
            await setGroupRules(payload);
            this.showToast("Aturan komposisi tim berhasil disimpan ✅");
            form.reset();
            const panel = document.querySelector("[data-rules-panel]");
            if (panel) panel.hidden = true;
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleCreateTimeline(form) {
        this.resetFormState(form);
        const formData = new FormData(form);

        // Ensure dates are in YYYY-MM-DD format if date input is used
        const startAt = formData.get("start_at");
        const endAt = formData.get("end_at");

        const payload = {
            title: formData.get("title")?.trim(),
            description: formData.get("description")?.trim(),
            start_at: startAt,
            end_at: endAt,
            batch_id: formData.get("batch_id")?.trim()
        };

        if (!payload.title || !payload.start_at || !payload.end_at || !payload.batch_id) {
            this.showFormFeedback(form, "Mohon lengkapi semua field wajib", true);
            return;
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { createTimeline } = await import("./services/adminService.js");
            await createTimeline(payload);
            this.showToast("Timeline berhasil dibuat ✅");
            this.closeModal();
            form.reset();
            this.router.loadRoute();
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    // Edit Timeline
    openEditTimelineModal(item) {
        const modal = document.querySelector('[data-modal="edit-timeline"]');
        const backdrop = document.querySelector("[data-modal-backdrop]");
        const form = modal?.querySelector('form');

        if (modal && backdrop && form) {
            form.querySelector('[name="id"]').value = item.id;
            form.querySelector('[name="title"]').value = item.title;
            form.querySelector('[name="description"]').value = item.description || '';

            // Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
            const toDatetimeLocal = (isoString) => {
                if (!isoString) return '';
                const date = new Date(isoString);
                const pad = (num) => String(num).padStart(2, '0');
                const year = date.getFullYear();
                const month = pad(date.getMonth() + 1);
                const day = pad(date.getDate());
                const hours = pad(date.getHours());
                const minutes = pad(date.getMinutes());
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };

            form.querySelector('[name="start_at"]').value = toDatetimeLocal(item.start_at);
            form.querySelector('[name="end_at"]').value = toDatetimeLocal(item.end_at);

            modal.hidden = false;
            backdrop.hidden = false;
        }
    }

    async handleEditTimeline(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const id = formData.get("id");

        const payload = {
            title: formData.get("title")?.trim(),
            description: formData.get("description")?.trim(),
            start_at: formData.get("start_at"),
            end_at: formData.get("end_at")
        };

        if (!payload.title || !payload.start_at || !payload.end_at) {
            this.showFormFeedback(form, "Mohon lengkapi semua field wajib", true);
            return;
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { updateTimeline } = await import("./services/adminService.js");
            await updateTimeline(id, payload);
            this.showToast("Timeline berhasil diperbarui ✅");
            this.closeModal();
            form.reset();
            this.router.loadRoute();
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleDeleteTimeline(id) {
        try {
            const { deleteTimeline } = await import("./services/adminService.js");
            await deleteTimeline(id);
            this.showToast("Timeline berhasil dihapus ✅");
            this.router.loadRoute();
        } catch (error) {
            this.showToast(error.message || "Gagal menghapus timeline", true);
        }
    }


    async handleStartProject(groupId) {
        try {
            await updateProjectStatus(groupId);
            this.showToast("Proyek berhasil dimulai ✅");
            this.router.loadRoute();
        } catch (error) {
            this.showToast("Gagal memulai proyek. Coba lagi.");
        }
    }

    openValidationModal(groupId, status) {
        const modal = document.querySelector('[data-modal="validate-group"]');
        const backdrop = document.querySelector("[data-modal-backdrop]");
        const form = modal?.querySelector("[data-validation-form]");
        const title = modal?.querySelector("[data-modal-title]");
        const reasonRow = modal?.querySelector("[data-rejection-reason-row]");

        if (!modal || !form) return;

        const action = status === "accepted" ? "accept" : "reject";
        form.querySelector('[name="group_id"]').value = groupId;
        form.querySelector('[name="action"]').value = action;

        if (title) {
            title.textContent = action === "accept" ? "Terima Tim" : "Tolak Tim";
        }

        if (reasonRow) {
            reasonRow.hidden = action !== "reject";
        }

        if (modal && backdrop) {
            modal.hidden = false;
            backdrop.hidden = false;
        }
    }

    async openEditGroupModal(groupId) {
        try {
            console.log("[openEditGroupModal] Opening edit modal for groupId:", groupId);
            const { listAllGroups } = await import("./services/adminService.js");
            const response = await listAllGroups();

            // Handle different response structures
            let groups = [];
            if (response?.data && Array.isArray(response.data)) {
                groups = response.data;
            } else if (response?.groups && Array.isArray(response.groups)) {
                groups = response.groups;
            } else if (Array.isArray(response)) {
                groups = response;
            }

            console.log("[openEditGroupModal] Groups fetched:", groups.length);

            // Normalize field names - same as in AdminTeamInfoPage
            const normalizedGroups = groups.map(group => ({
                group_id: group.group_id || group.id || group.groupId || null,
                group_name: group.group_name || group.name || group.groupName || "-",
                batch_id: group.batch_id || group.batchId || "-",
                status: group.status || group.group_status || "pending",
                project_status: group.project_status || group.projectStatus || "not_started",
                members: group.members || group.group_members || [],
                ...group // Keep all other fields
            }));

            // Find group with multiple matching strategies
            const group = normalizedGroups.find((g) => {
                const gId = g.group_id || g.id || g.groupId;
                return (
                    gId === groupId ||
                    String(gId) === String(groupId) ||
                    gId?.toString() === groupId?.toString()
                );
            });

            console.log("[openEditGroupModal] Group found:", group);
            console.log("[openEditGroupModal] Searching for:", groupId);
            console.log("[openEditGroupModal] Available IDs:", normalizedGroups.map(g => g.group_id || g.id));

            if (!group) {
                console.error("[openEditGroupModal] Group not found. Available groups:", normalizedGroups);
                this.showToast("Grup tidak ditemukan. Silakan refresh halaman.");
                return;
            }

            const modal = document.querySelector('[data-modal="edit-group"]');
            const backdrop = document.querySelector("[data-modal-backdrop]");
            const form = modal?.querySelector("[data-edit-group-form]");

            if (!modal || !form) {
                console.error("[openEditGroupModal] Modal or form not found");
                return;
            }

            // Use normalized fields
            const groupIdInput = form.querySelector('[name="group_id"]');
            const groupNameInput = form.querySelector('[name="group_name"]');
            const batchIdInput = form.querySelector('[name="batch_id"]');
            const statusInput = form.querySelector('[name="status"]');

            if (groupIdInput) groupIdInput.value = group.group_id || group.id || "";
            if (groupNameInput) groupNameInput.value = group.group_name || group.name || "";
            if (batchIdInput) batchIdInput.value = group.batch_id || group.batchId || "";
            if (statusInput) {
                const statusValue = (group.status || "pending").toLowerCase();
                statusInput.value = statusValue;

                // Toggle rejection reason visibility
                const reasonGroup = form.querySelector("[data-rejection-reason-group]");
                if (reasonGroup) {
                    reasonGroup.hidden = statusValue !== "rejected";
                }
            }

            console.log("[openEditGroupModal] Form populated:", {
                group_id: group.group_id || group.id,
                group_name: group.group_name || group.name,
                batch_id: group.batch_id || group.batchId,
                status: group.status
            });

            if (modal && backdrop) {
                modal.hidden = false;
                backdrop.hidden = false;
            }
        } catch (error) {
            console.error("[openEditGroupModal] Error:", error);
            this.showToast("Gagal memuat data grup");
        }
    }

    addRuleField() {
        const rulesList = document.getElementById("rules-list");
        if (!rulesList) return;

        const newRule = document.createElement("div");
        newRule.className = "rule-item";
        newRule.style.cssText = "padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; position: relative;";
        newRule.innerHTML = `
      <button type="button" class="btn-icon-tiny" onclick="this.closest('.rule-item').remove()" style="position: absolute; top: 8px; right: 8px; background: #fee; color: #c33; border: none; cursor: pointer; width: 24px; height: 24px; border-radius: 4px; font-size: 16px; display: flex; align-items: center; justify-content: center;">×</button>
      <div style="display: grid; gap: 12px;">
        <div class="form-row">
          <label style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 4px;">Learning Path</label>
          <select name="attribute_value" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
            <option value="">Pilih Learning Path</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Front-End & Back-End">Front-End & Back-End</option>
            <option value="React & Back-End">React & Back-End</option>
            <option value="Cloud Computing">Cloud Computing</option>
            <option value="Mobile Development">Mobile Development</option>
          </select>
        </div>
        <div class="form-row">
          <label style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 4px;">Operator</label>
          <select name="operator" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
            <option value=">=">Minimal (>=)</option>
            <option value="<=">Maksimal (<=)</option>
            <option value="==">Sama dengan (==)</option>
          </select>
        </div>
        <div class="form-row">
          <label style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 4px;">Jumlah Anggota</label>
          <input type="number" name="value" min="1" max="10" placeholder="Contoh: 2" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" />
        </div>
        <input type="hidden" name="user_attribute" value="learning_path" />
      </div>
    `;
        rulesList.appendChild(newRule);
    }

    openEditMemberModal(userId) {
        const modal = document.querySelector("[data-modal='edit-member']");
        if (!modal) return;
        const form = modal.querySelector("form");
        if (form) {
            form.querySelector("[name='user_id']").value = userId;
        }
        modal.hidden = false;
    }

    async viewGroupDetail(groupId) {
        try {
            console.log("[viewGroupDetail] Opening detail for groupId:", groupId);
            const { getGroupById } = await import("./services/adminService.js");
            const { getUseCases } = await import("./services/userService.js");

            // Fetch specific group detail and use cases
            let groupResponse = null;
            let useCasesResponse = null;

            try {
                [groupResponse, useCasesResponse] = await Promise.all([
                    getGroupById(groupId).catch(e => {
                        console.warn("[viewGroupDetail] Failed to fetch group detail:", e);
                        return null;
                    }),
                    getUseCases().catch(() => ({ data: [] }))
                ]);
            } catch (e) {
                console.error("[viewGroupDetail] Critical error fetching data", e);
            }

            // If group response failed (null or error), try to proceed or show error
            if (!groupResponse) {
                this.showToast("Gagal mengambil detail grup dari server. Menampilkan data terbatas jika ada.", true);
                // Optionally try to find from existing list if available in DOM
            }

            // Normalize group data from specific endpoint
            const rawGroup = groupResponse?.data || groupResponse || {};

            const group = {
                group_id: rawGroup.group_id || rawGroup.id || rawGroup.groupId || null,
                group_name: rawGroup.group_name || rawGroup.name || rawGroup.groupName || "-",
                batch_id: rawGroup.batch_id || rawGroup.batchId || "-",
                status: rawGroup.status || rawGroup.group_status || "pending",
                project_status: rawGroup.project_status || rawGroup.projectStatus || "not_started",
                members: rawGroup.members || rawGroup.group_members || rawGroup.users || [],
                use_case_source_id: rawGroup.use_case_source_id || rawGroup.use_case_id || rawGroup.use_case_ref || null,
                use_case_name: rawGroup.use_case_name || rawGroup.use_case || null,
                description: rawGroup.description || rawGroup.desc || null,
                ...rawGroup // Keep other fields
            };

            const useCases = useCasesResponse?.data || [];

            // Log fetched group data
            console.log("[viewGroupDetail] Group fetched:", group);
            console.log("[viewGroupDetail] Group members:", group.members);

            if (!group.group_id) {
                console.error("[viewGroupDetail] Group ID missing in response");
                this.showToast("Gagal memuat detail tim");
                return;
            }

            // Find use case name if we have use_case_source_id
            if (group.use_case_source_id && useCases.length > 0) {
                const useCase = useCases.find(uc => {
                    const ucId = uc.capstone_use_case_source_id || uc.id || uc.use_case_id;
                    return ucId === group.use_case_source_id || String(ucId) === String(group.use_case_source_id);
                });
                if (useCase) {
                    group.use_case_name = useCase.name || group.use_case_name;
                    group.use_case_company = useCase.company || null;
                }
            }

            // Render content into the modal body
            const modal = document.querySelector('[data-modal="group-detail"]');
            const backdrop = document.querySelector("[data-modal-backdrop]");
            const contentArea = modal?.querySelector("[data-group-detail-content]");

            if (!modal) {
                console.error("[viewGroupDetail] Modal not found");
                this.showToast("Modal detail tidak ditemukan");
                return;
            }

            if (!contentArea) {
                console.error("[viewGroupDetail] Content area not found");
                this.showToast("Area konten tidak ditemukan");
                return;
            }

            if (!window.renderGroupDetail) {
                console.error("[viewGroupDetail] renderGroupDetail function not found");
                this.showToast("Fungsi render tidak ditemukan");
                return;
            }

            // Render the detail content
            contentArea.innerHTML = window.renderGroupDetail(group);

            // Show modal and backdrop
            if (modal && backdrop) {
                modal.hidden = false;
                backdrop.hidden = false;
                console.log("[viewGroupDetail] Modal opened successfully");
            } else {
                modal.hidden = false;
                console.log("[viewGroupDetail] Modal opened (no backdrop)");
            }
        } catch (error) {
            console.error("[viewGroupDetail] Error:", error);
            this.showToast("Gagal memuat detail tim");
        }
    }

    handleRandomizeTeams() {
        this.showToast("Fitur randomize peserta akan segera tersedia (Simulasi) 🎲");
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

        // Handle button with btn-text and btn-loading spans (team registration)
        const btnText = submitButton.querySelector('.btn-text');
        const btnLoading = submitButton.querySelector('.btn-loading');

        if (btnText && btnLoading) {
            if (isLoading) {
                btnText.hidden = true;
                btnLoading.hidden = false;
                submitButton.disabled = true;
            } else {
                btnText.hidden = false;
                btnLoading.hidden = true;
                submitButton.disabled = false;
            }
            return;
        }

        // Fallback for buttons without spans
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
            const isAdmin = session.user.role?.toLowerCase() === "admin";
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

    async populateProfileForm() {
        const form = this.profilePanel?.querySelector("[data-profile-form]");
        if (!form) return;
        const session = this.ensureSessionDefaults(readSession());
        console.log("[DEBUG] Populating Profile. Session:", session);


        if (!session?.user) {
            form.reset();
            const nameInput = form.querySelector("[data-profile-name]");
            if (nameInput) nameInput.value = "";
            this.syncAvatarCards(form, "male");
            return;
        }

        // Fetch latest profile from API
        try {
            const profileResponse = await getProfile();
            console.log("[DEBUG] API Profile Response:", profileResponse);
            const profileData = profileResponse?.data || {};
            console.log("[DEBUG] Extracted Profile Data:", profileData);
            console.log("[DEBUG] Learning Path Value:", profileData.learning_path);

            // Populate form fields
            const nameInput = form.querySelector("[data-profile-name]");
            if (nameInput) {
                nameInput.value = profileData.name || session.user.name || session.user.full_name || "";
            }

            const studentIdInput = form.querySelector("[data-profile-student-id]");
            if (studentIdInput) {
                studentIdInput.value = profileData.users_source_id || session.user.users_source_id || "-";
            }

            // Apply Admin Theme if role is admin
            const role = (profileData.role || session.user.role || "").toLowerCase();
            const isAdmin = role === 'admin';
            if (this.profilePanel) {
                if (isAdmin) {
                    this.profilePanel.classList.add('admin-theme');
                } else {
                    this.profilePanel.classList.remove('admin-theme');
                }

                // Hide Student/Academic fields for Admin
                const academicSection = this.profilePanel.querySelector('[data-section="academic"]');
                const studentIdGroup = this.profilePanel.querySelector('[data-group="student-id"]');
                const accountSectionTitle = this.profilePanel.querySelector('[data-section="account"] .profile-section-title');

                if (isAdmin) {
                    if (academicSection) academicSection.style.display = 'none';
                    if (studentIdGroup) studentIdGroup.style.display = 'none';
                    if (accountSectionTitle) accountSectionTitle.textContent = "Detail Admin";

                    // Center the account section if academic is hidden
                    const profileGrid = this.profilePanel.querySelector('.profile-grid');
                    if (profileGrid) {
                        profileGrid.style.gridTemplateColumns = "1fr";
                        profileGrid.style.maxWidth = "500px";
                        profileGrid.style.margin = "0 auto";
                    }
                } else {
                    if (academicSection) academicSection.style.display = '';
                    if (studentIdGroup) studentIdGroup.style.display = '';
                    if (accountSectionTitle) accountSectionTitle.textContent = "Detail Akun";
                    // Reset grid styles
                    const profileGrid = this.profilePanel.querySelector('.profile-grid');
                    if (profileGrid) {
                        profileGrid.style.gridTemplateColumns = "";
                        profileGrid.style.maxWidth = "";
                        profileGrid.style.margin = "";
                    }
                }
            }

            const avatarValue = session.user.avatar || "male";
            const radio = form.querySelector(
                `input[name="avatar"][value="${avatarValue}"]`,
            );
            if (radio) radio.checked = true;
            this.syncAvatarCards(form, avatarValue);

            // Populate learning_path, university, learning_group
            // Populate learning_path, university, learning_group
            const lpContainer = form.querySelector("#learning-path-badge-container");
            const lpBadgeText = form.querySelector("#learning-path-display-text");
            const lpSelect = form.querySelector('[data-profile-learning-path]');

            if (lpSelect) {
                const currentLearningPath = profileData.learning_path || "";

                if (currentLearningPath) {
                    // Mode: LOCKED (Badge)
                    lpSelect.value = currentLearningPath;
                    lpSelect.hidden = true;

                    if (lpContainer) lpContainer.hidden = false;
                    if (lpBadgeText) lpBadgeText.textContent = currentLearningPath;
                } else {
                    // Mode: EDIT (Select)
                    lpSelect.value = "";
                    lpSelect.hidden = false;
                    lpSelect.disabled = false;

                    if (lpContainer) lpContainer.hidden = true;
                }
            }


            const universityInput = form.querySelector("[data-profile-university]");
            if (universityInput) {
                universityInput.value = profileData.university || "";
            }

            const learningGroupInput = form.querySelector("[data-profile-learning-group]");
            if (learningGroupInput) {
                learningGroupInput.value = profileData.learning_group || "";
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            // Fallback to session data if API fails
            const nameInput = form.querySelector("[data-profile-name]");
            if (nameInput) nameInput.value = session.user.name || session.user.full_name || "";
            const avatarValue = session.user.avatar || "male";
            const radio = form.querySelector(
                `input[name="avatar"][value="${avatarValue}"]`,
            );
            if (radio) radio.checked = true;
            this.syncAvatarCards(form, avatarValue);
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

        try {
            this.toggleSubmitLoading(form, true);

            // Get current profile to check if learning_path is already set
            const currentProfile = await getProfile();
            const currentLearningPath = currentProfile?.data?.learning_path;

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

            // Get new values from form
            const learningPath = formData.get("learning_path")?.toString().trim() || "";
            const university = formData.get("university")?.toString().trim() || "";
            const learningGroup = formData.get("learning_group")?.toString().trim() || "";

            // Strict Check: If learning_path is already set in DB, user cannot change it
            if (currentLearningPath && learningPath && learningPath !== currentLearningPath) {
                this.showToast(" sLearning Pathudah diset dan tidak bisa diubah.");
                // Revert UI to current value
                const learningPathSelect = form.querySelector("[data-profile-learning-path]");
                if (learningPathSelect) {
                    learningPathSelect.value = currentLearningPath;
                    learningPathSelect.disabled = true;
                }
                this.toggleSubmitLoading(form, false);
                return;
            }

            // Prepare payload
            const payload = {
                name: newName,
                university: university,
                learning_group: learningGroup,
            };

            console.log("[DEBUG] Current Profile:", currentProfile);
            console.log("[DEBUG] Current Learning Path:", currentLearningPath);
            console.log("[DEBUG] New Learning Path from Form:", learningPath);

            // Only include learning_path if it's NOT currently set and user provided a value
            if (!currentLearningPath && learningPath) {
                payload.learning_path = learningPath;
                console.log("[DEBUG] Adding learning_path to payload");
            } else {
                console.log("[DEBUG] NOT adding learning_path. Reason:",
                    currentLearningPath ? "Already set" : "No new value provided");
            }

            console.log("Updating profile with payload:", payload);

            const updateResponse = await updateProfile(payload);

            // Update session with new data
            const updatedSession = {
                ...session,
                user: {
                    ...session.user,
                    name: updateResponse?.data?.name || newName,
                    full_name: updateResponse?.data?.name || newName,
                    email: updateResponse?.data?.email || session.user.email,
                    role: updateResponse?.data?.role || session.user.role,
                    avatar, // Avatar is local-only for now as it's not in the API payload
                    learning_path: updateResponse?.data?.learning_path || currentLearningPath || learningPath,
                    university: updateResponse?.data?.university || university,
                    learning_group: updateResponse?.data?.learning_group || learningGroup,
                },
            };

            persistSession(updatedSession);
            this.updateAuthWidgets();
            await this.populateProfileForm();
            this.showToast("Profil berhasil diperbarui.");
            this.toggleProfilePanel(false);

            // Reload route content to reflect changes (e.g. if dashboard shows name)
            this.router.loadRoute();

        } catch (error) {
            console.error("Error updating profile:", error);
            const errorMessage = error?.message || "Gagal memperbarui profil.";
            this.showToast(errorMessage);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleTeamRegistrationSubmit(form, event) {
        if (event) event.preventDefault();
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
            console.log("[handleTeamRegistrationSubmit] Success:", response);
            this.showToast("Pendaftaran tim berhasil dikirim dan menunggu validasi ✅");
            form.reset();
            this.toggleTeamRegistrationPanel(false);
            // Reload the page to show updated team data
            setTimeout(() => {
                this.router.loadRoute();
            }, 1000);
        } catch (error) {
            console.error("[handleTeamRegistrationSubmit] Error:", error);
            const errorMessage = error?.details?.message || error?.message || "Gagal mendaftarkan tim. Silakan coba lagi.";
            this.showFormFeedback(form, errorMessage, true);
            this.showToast(errorMessage);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleWorksheetSubmit(form) {
        this.resetFormState(form);
        const formData = new FormData(form);

        const payload = {
            period_id: formData.get("period_id")?.trim() || "",
            activity_description: formData.get("activity_description")?.trim() || "",
            proof_url: formData.get("proof_url")?.trim() || "",
        };

        if (!payload.period_id || !payload.activity_description || !payload.proof_url) {
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
    attachFormHandlers() {
        // ... existing ... 
        // Add logic to attach handlers for admin specific generated content if needed
        // But since we use delegation in handleNavigation/setupAuthHandlers, we might just add cases there.
    }

    // ... existing Admin Actions ...

    async handleAdminAction(action) {
        switch (action) {
            case "create-group":
                this.openModal("create-group");
                break;
            case "set-registration-period":
                await this.openRegistrationPeriodModal();
                break;
            case "set-rules":
                this.openModal("set-rules");
                break;
            case "export-data":
                await this.handleExportData();
                break;
            case "randomize-teams":
                await this.openRandomizeTeamsModal();
                break;
            case "randomize":
                this.handleRandomize();
                break;
            default:
                console.warn("Unknown admin action:", action);
        }
    }

    // Handler for opening Edit Member Modal
    openEditMemberModal(userId) {
        const modal = document.querySelector('[data-modal="edit-member"]');
        const backdrop = document.querySelector("[data-modal-backdrop]");
        const userIdInput = modal?.querySelector("[data-user-id-input]");

        if (modal && backdrop && userIdInput) {
            userIdInput.value = userId;
            modal.hidden = false;
            backdrop.hidden = false;
        }
    }

    async handleUpdateUserLearningPath(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const userId = formData.get("user_id");
        const learningPath = formData.get("learning_path");

        if (!userId || !learningPath) {
            this.showFormFeedback(form, "Pilih Learning Path baru", true);
            return;
        }

        const payload = { learning_path: learningPath };

        try {
            this.toggleSubmitLoading(form, true);
            const { updateUserLearningPath } = await import("./services/adminService.js");
            await updateUserLearningPath(userId, payload);
            this.showToast("Learning Path berhasil diperbarui ✅");
            this.closeModal();
            form.reset();
            this.router.loadRoute(); // Refresh to show changes
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    // ... existing methods ...


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

    async handleEditGroup(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const groupId = formData.get("group_id");
        const status = formData.get("status");

        // Rejection reason validation
        if (status === "rejected") {
            const reason = formData.get("rejection_reason")?.trim();
            if (!reason) {
                this.showFormFeedback(form, "Alasan penolakan wajib diisi untuk status Rejected", true);
                const reasonGroup = form.querySelector("[data-rejection-reason-group]");
                if (reasonGroup) reasonGroup.hidden = false;
                return;
            }
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { updateAdminGroup, validateGroupRegistration } = await import("./services/adminService.js");

            // 1. Update basic info (Name, Batch, etc.)
            const updatePayload = {
                group_name: formData.get("group_name")?.trim(),
                batch_id: formData.get("batch_id")?.trim(),
                status: status // Update status in DB
            };

            await updateAdminGroup(groupId, updatePayload);

            // 2. Trigger Validation Logic (Email & Reason) if Accepted/Rejected
            // This ensures the email is sent even if the update endpoint doesn't handle it
            if (status === "accepted" || status === "rejected") {
                const validationPayload = { status: status };
                if (status === "rejected") {
                    validationPayload.rejection_reason = formData.get("rejection_reason")?.trim();
                }
                await validateGroupRegistration(groupId, validationPayload);
            }

            this.showToast("Data tim berhasil diperbarui ✅");
            this.closeModal();
            this.router.loadRoute();
        } catch (error) {
            console.error("Error editing group:", error);
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
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
        const batchId = formData.get("batch_id")?.trim();
        const useCaseRef = formData.get("use_case_ref")?.trim();
        const isActive = formData.get("is_active") === "on";

        if (!batchId) {
            this.showFormFeedback(form, "Batch ID wajib diisi", true);
            return;
        }

        // Collect all rules from the form
        const rules = [];
        const ruleItems = form.querySelectorAll(".rule-item");
        ruleItems.forEach((item) => {
            const userAttribute = item.querySelector('[name="user_attribute"]')?.value || "learning_path";
            const attributeValue = item.querySelector('[name="attribute_value"]')?.value;
            const operator = item.querySelector('[name="operator"]')?.value;
            const value = item.querySelector('[name="value"]')?.value;

            if (attributeValue && operator && value) {
                rules.push({
                    user_attribute: userAttribute,
                    attribute_value: attributeValue,
                    operator: operator,
                    value: parseInt(value) || value,
                });
            }
        });

        if (rules.length === 0) {
            this.showFormFeedback(form, "Minimal satu aturan komposisi harus ditambahkan", true);
            return;
        }

        const payload = {
            batch_id: batchId,
            rules: rules,
            is_active: isActive,
        };

        if (useCaseRef) {
            payload.use_case_ref = useCaseRef;
        }

        try {
            this.toggleSubmitLoading(form, true);
            await setGroupRules(payload);
            this.showToast("Aturan komposisi tim berhasil disimpan ✅");
            this.closeModal();
            form.reset();
            // Clear rules list
            const rulesList = document.getElementById("rules-list");
            if (rulesList) rulesList.innerHTML = "";
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async openValidationModal(groupId, status) {
        const modal = document.querySelector('[data-modal="validate-group"]');
        const backdrop = document.querySelector("[data-modal-backdrop]");
        const form = modal?.querySelector("[data-validation-form]");
        const title = modal?.querySelector("[data-modal-title]");
        const reasonRow = modal?.querySelector("[data-rejection-reason-row]");
        const confirmationMessage = modal?.querySelector("[data-confirmation-message]");
        const submitButton = form?.querySelector('[type="submit"]');
        const groupInfo = modal?.querySelector("[data-group-info]");
        const groupName = modal?.querySelector("[data-group-name]");
        const groupBatch = modal?.querySelector("[data-group-batch]");
        const groupMembers = modal?.querySelector("[data-group-members]");

        if (!modal || !form) return;

        // Fetch group details to show in modal
        try {
            const { listAllGroups } = await import("./services/adminService.js");
            const response = await listAllGroups();
            const groups = response?.data || response?.groups || response || [];
            const group = groups.find((g) =>
                (g.group_id || g.id) === groupId ||
                String(g.group_id || g.id) === String(groupId)
            );

            if (group && groupInfo) {
                const normalizedGroup = {
                    group_name: group.group_name || group.name || "-",
                    batch_id: group.batch_id || group.batchId || "-",
                    members: group.members || group.group_members || []
                };

                if (groupName) groupName.textContent = normalizedGroup.group_name;
                if (groupBatch) groupBatch.textContent = normalizedGroup.batch_id;
                if (groupMembers) groupMembers.textContent = `${normalizedGroup.members.length} anggota`;
            }
        } catch (error) {
            console.error("Error fetching group details:", error);
        }

        const action = status === "accepted" ? "accept" : "reject";
        const groupIdInput = form.querySelector('[name="group_id"]');
        const actionInput = form.querySelector('[name="action"]');
        const statusInput = form.querySelector('[name="status"]');

        if (groupIdInput) groupIdInput.value = groupId;
        if (actionInput) actionInput.value = action;
        if (statusInput) {
            statusInput.value = status;
        } else {
            // Add status input if it doesn't exist
            const statusHidden = document.createElement('input');
            statusHidden.type = 'hidden';
            statusHidden.name = 'status';
            statusHidden.value = status;
            form.appendChild(statusHidden);
        }

        if (title) {
            title.textContent = action === "accept" ? "Terima Tim" : "Tolak Tim";
        }

        if (confirmationMessage) {
            confirmationMessage.textContent = action === "accept"
                ? "Apakah Anda yakin ingin menerima tim ini? Tim yang diterima dapat memulai proyek capstone."
                : "Apakah Anda yakin ingin menolak tim ini? Pastikan alasan penolakan sudah diisi.";
        }

        if (submitButton) {
            submitButton.textContent = action === "accept" ? "✅ Terima Tim" : "❌ Tolak Tim";
            submitButton.className = action === "accept" ? "btn btn-success" : "btn btn-danger";
        }

        if (reasonRow) {
            reasonRow.hidden = action !== "reject";
            const textarea = reasonRow.querySelector('textarea[name="rejection_reason"]');
            if (textarea && action === "reject") {
                textarea.required = true;
            }
        }

        if (modal && backdrop) {
            modal.hidden = false;
            backdrop.hidden = false;
        }
    }

    async handleValidateGroup(form) {
        console.log("[DEBUG] Handling Validate Group Submission");
        this.resetFormState(form);
        const formData = new FormData(form);
        const groupId = formData.get("group_id");
        const status = formData.get("status") || formData.get("action");

        // Normalize status
        let normalizedStatus = status;
        if (status === "accept" || status === "accepted") {
            normalizedStatus = "accepted";
        } else if (status === "reject" || status === "rejected") {
            normalizedStatus = "rejected";
        }

        const reason = formData.get("rejection_reason")?.trim(); // Moved up for payload

        const payload = {
            status: normalizedStatus,
            rejection_reason: normalizedStatus === "rejected" ? reason : ""
        };

        if (normalizedStatus === "rejected") {
            if (!reason) {
                this.showFormFeedback(form, "Alasan penolakan wajib diisi", true);
                const reasonRow = form.querySelector("[data-rejection-reason-row]");
                if (reasonRow) reasonRow.hidden = false;
                return;
            }
            payload.rejection_reason = reason;
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { validateGroupRegistration } = await import("./services/adminService.js");
            await validateGroupRegistration(groupId, payload);
            this.showToast(
                `Tim ${normalizedStatus === "accepted" ? "diterima" : "ditolak"} ✅`
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
            const { updateProjectStatus } = await import("./services/adminService.js");
            await updateProjectStatus(groupId);
            this.showToast("Proyek dimulai ✅");
            this.router.loadRoute();
        } catch (error) {
            this.showToast("Gagal memulai proyek. Coba lagi.");
            console.error("Error starting project:", error);
        }
    }


    closeGroupDetail() {
        const panel = document.querySelector("[data-group-detail-panel]");
        if (panel) {
            panel.hidden = true;
        }
        this.router.navigate("admin-team-information");
    }

    async handleExportData() {
        try {
            this.showToast("Mengekspor data tim...");
            const { exportTeamsData, listAllGroups, getGroupById } = await import("./services/adminService.js");

            // Try to use export endpoint first, fallback to listAllGroups
            let basicGroups = [];
            try {
                const exportResponse = await exportTeamsData();
                basicGroups = exportResponse?.data || exportResponse || [];
            } catch (exportError) {
                console.warn("Export endpoint not available, using listAllGroups:", exportError);
                const response = await listAllGroups();
                basicGroups = response?.data || response?.groups || response || [];
            }

            if (!Array.isArray(basicGroups) || basicGroups.length === 0) {
                this.showToast("Tidak ada data tim untuk diekspor");
                return;
            }

            this.showToast("Mengambil detail anggota tim...");

            // Fetch detailed group data to get members
            const data = await Promise.all(basicGroups.map(async (g) => {
                try {
                    const groupId = g.group_id || g.id || g.groupId;
                    if (!groupId) return g;
                    const detailRes = await getGroupById(groupId);
                    const detail = detailRes?.data || detailRes || {};
                    return { ...g, ...detail };
                } catch (e) {
                    console.warn("Failed to get group detail:", e);
                    return g;
                }
            }));

            // Use xlsx library for Excel export
            const XLSX = await import("xlsx");
            const { utils, writeFile } = XLSX;

            const wb = utils.book_new();

            // Prepare clean data for export
            const cleanData = data.map(group => {
                const members = group.members || group.group_members || group.users || [];
                const memberNames = members.map(m =>
                    m.full_name || m.name || m.email || "Unknown"
                );

                return {
                    "Nama Tim": group.group_name || group.name || "-",
                    "Batch ID": group.batch_id || "-",
                    "Status": (group.status || "pending").toUpperCase(),
                    "Jumlah Anggota": members.length,
                    "Status Proyek": (group.project_status || "not_started").replace(/_/g, " "),
                    "Anggota 1": memberNames[0] || "-",
                    "Anggota 2": memberNames[1] || "-",
                    "Anggota 3": memberNames[2] || "-",
                    "Anggota 4": memberNames[3] || "-",
                    "Anggota 5": memberNames[4] || "-"
                };
            });

            const wsSheet = utils.json_to_sheet(cleanData);
            utils.book_append_sheet(wb, wsSheet, "Team Data");

            // Generate and download Excel file
            writeFile(wb, `Teams_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

            this.showToast("Data tim berhasil diekspor ke Excel ✅");
        } catch (error) {
            console.error("Error exporting teams:", error);
            this.showToast("Gagal mengekspor data tim");
        }
    }

    async openRandomizeTeamsModal() {
        try {
            const { getStudentsWithoutTeam } = await import("./services/adminService.js");
            const response = await getStudentsWithoutTeam();
            const students = response?.data || response || [];

            const modal = document.querySelector('[data-modal="randomize-teams"]');
            const backdrop = document.querySelector("[data-modal-backdrop]");

            if (modal && backdrop) {
                // Show count of students without team
                const form = modal.querySelector('form');
                if (form && students.length > 0) {
                    const infoText = form.querySelector('.text-sm.text-muted');
                    if (infoText) {
                        infoText.textContent = `Terdapat ${students.length} peserta yang belum memiliki tim. Fitur ini akan secara otomatis membentuk tim untuk mereka berdasarkan progres belajar.`;
                    }
                }

                modal.hidden = false;
                backdrop.hidden = false;
            }
        } catch (error) {
            console.error("Error opening randomize modal:", error);
            this.showToast("Gagal memuat data peserta");
        }
    }

    async openRegistrationPeriodModal() {
        try {
            const { getRegistrationPeriod } = await import("./services/adminService.js");
            const response = await getRegistrationPeriod();
            const period = response?.data || response || {};

            const modal = document.querySelector('[data-modal="registration-period"]');
            const backdrop = document.querySelector("[data-modal-backdrop]");
            const form = modal?.querySelector('form');

            if (modal && backdrop && form) {
                // Populate form if period exists
                if (period.start_date) {
                    const startInput = form.querySelector('[name="start_date"]');
                    if (startInput) {
                        // Convert to datetime-local format
                        const startDate = new Date(period.start_date);
                        startInput.value = startDate.toISOString().slice(0, 16);
                    }
                }

                if (period.end_date) {
                    const endInput = form.querySelector('[name="end_date"]');
                    if (endInput) {
                        const endDate = new Date(period.end_date);
                        endInput.value = endDate.toISOString().slice(0, 16);
                    }
                }

                if (period.is_active !== undefined) {
                    const activeCheckbox = form.querySelector('[name="is_active"]');
                    if (activeCheckbox) {
                        activeCheckbox.checked = period.is_active;
                    }
                }

                modal.hidden = false;
                backdrop.hidden = false;
            }
        } catch (error) {
            console.error("Error opening registration period modal:", error);
            // Still open modal even if fetch fails
            const modal = document.querySelector('[data-modal="registration-period"]');
            const backdrop = document.querySelector("[data-modal-backdrop]");
            if (modal && backdrop) {
                modal.hidden = false;
                backdrop.hidden = false;
            }
        }
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

    async handleWorksheetDeadline(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const deadline = formData.get("deadline");
        const enabled = formData.get("auto_validate_enabled") === "on";

        if (enabled && !deadline) {
            this.showFormFeedback(form, "Deadline wajib diisi jika validasi otomatis diaktifkan", true);
            return;
        }

        try {
            // Simpan ke localStorage
            if (deadline) {
                localStorage.setItem('worksheet-deadline', deadline);
            }
            localStorage.setItem('worksheet-deadline-enabled', enabled.toString());

            // Setup auto validation
            if (enabled && deadline) {
                this.setupAutoValidation(deadline);
                this.showToast("Pengaturan deadline validasi otomatis berhasil disimpan ✅");
            } else {
                // Clear interval jika disabled
                if (this.autoValidationInterval) {
                    clearInterval(this.autoValidationInterval);
                    this.autoValidationInterval = null;
                }
                this.showToast("Validasi otomatis dinonaktifkan");
            }

            // Reload untuk update UI
            this.router.loadRoute();
        } catch (error) {
            this.showFormFeedback(form, "Gagal menyimpan pengaturan deadline", true);
        }
    }

    setupAutoValidation(deadlineStr) {
        // Clear existing interval
        if (this.autoValidationInterval) {
            clearInterval(this.autoValidationInterval);
        }

        const deadline = new Date(deadlineStr);
        const now = new Date();

        if (deadline <= now) {
            this.showToast("Deadline harus di masa depan", true);
            return;
        }

        // Calculate time until deadline
        const timeUntilDeadline = deadline.getTime() - now.getTime();

        // Set interval to check every minute
        this.autoValidationInterval = setInterval(async () => {
            const currentTime = new Date();
            if (currentTime >= deadline) {
                // Deadline reached, run auto validation
                await this.runAutoValidation();
                // Clear interval after running
                if (this.autoValidationInterval) {
                    clearInterval(this.autoValidationInterval);
                    this.autoValidationInterval = null;
                }
            }
        }, 60000); // Check every minute

        this.showToast(`Validasi otomatis akan berjalan pada ${deadline.toLocaleString('id-ID')} WIB`);
    }

    async runAutoValidation() {
        try {
            this.showToast("Memulai validasi otomatis...", false);
            const { listAllWorksheets, validateWorksheet } = await import("./services/adminService.js");

            // Get all submitted worksheets
            const response = await listAllWorksheets('submitted');
            const worksheets = response?.data || [];

            if (worksheets.length === 0) {
                this.showToast("Tidak ada worksheet yang perlu divalidasi");
                return;
            }

            // Validate all submitted worksheets as "approved" by default
            let successCount = 0;
            let errorCount = 0;

            for (const ws of worksheets) {
                try {
                    await validateWorksheet(ws.id, {
                        status: 'completed',
                        feedback: 'Validasi otomatis berdasarkan deadline'
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Error validating worksheet ${ws.id}:`, error);
                    errorCount++;
                }
            }

            this.showToast(`Validasi otomatis selesai: ${successCount} berhasil, ${errorCount} gagal`);

            // Reload page to show updated data
            this.router.loadRoute();
        } catch (error) {
            console.error("Error running auto validation:", error);
            this.showToast("Gagal menjalankan validasi otomatis", true);
        }
    }

    async handleManualValidateAll() {
        const checkboxes = document.querySelectorAll('.worksheet-checkbox:checked');
        const worksheetIds = Array.from(checkboxes).map(cb => cb.dataset.worksheetId);

        if (worksheetIds.length === 0) {
            this.showToast("Pilih minimal satu worksheet untuk divalidasi", true);
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin memvalidasi ${worksheetIds.length} worksheet sekaligus?`)) {
            return;
        }

        try {
            this.showToast("Memproses validasi...", false);
            const { validateWorksheet } = await import("./services/adminService.js");

            // Validate each worksheet individually since bulk endpoint may not exist
            let successCount = 0;
            let errorCount = 0;

            for (const worksheetId of worksheetIds) {
                try {
                    await validateWorksheet(worksheetId, {
                        status: 'completed',
                        feedback: 'Validasi manual oleh admin'
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Error validating worksheet ${worksheetId}:`, error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                this.showToast(`${successCount} worksheet berhasil divalidasi${errorCount > 0 ? `, ${errorCount} gagal` : ''} ✅`);
                this.router.loadRoute();
            } else {
                this.showToast("Gagal memvalidasi worksheet", true);
            }
        } catch (error) {
            console.error("Error bulk validating worksheets:", error);
            this.showToast("Gagal memvalidasi worksheet", true);
        }
    }

    async exportWorksheetsData() {
        try {
            this.showToast("Menyiapkan export data...", false);

            // Fetch all worksheets directly from the existing API
            const { listAllWorksheets } = await import("./services/adminService.js");
            const wsResponse = await listAllWorksheets();
            const worksheets = wsResponse?.data || [];

            if (worksheets.length === 0) {
                this.showToast("Tidak ada data untuk diekspor", true);
                return;
            }

            // Use xlsx library for Excel export
            const XLSX = await import("xlsx");
            const { utils, writeFile } = XLSX;

            const wb = utils.book_new();

            // Prepare clean data for export
            const cleanData = worksheets.map(ws => ({
                "Nama Peserta": ws.users?.name || 'N/A',
                "Email": ws.users?.email || 'N/A',
                "Periode Mulai": ws.period_start || 'N/A',
                "Periode Akhir": ws.period_end || 'N/A',
                "Aktivitas": ws.activity_description || 'N/A',
                "Status": ws.status || 'N/A',
                "Feedback": ws.feedback || 'N/A',
                "Tanggal Submit": ws.submitted_at || 'N/A'
            }));

            const wsSheet = utils.json_to_sheet(cleanData);
            utils.book_append_sheet(wb, wsSheet, "Worksheet Data");

            // Generate and download Excel file
            writeFile(wb, `Worksheet_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

            this.showToast("Data berhasil diekspor ke Excel ✅");
        } catch (error) {
            console.error("Error exporting worksheets:", error);
            this.showToast("Gagal mengekspor data. Pastikan data worksheet tersedia.", true);
        }
    }



    async exportFeedbackData() {
        try {
            const { exportFeedbackData, listAllGroups, getGroupById } = await import("./services/adminService.js");

            this.showToast("Mengambil semua data feedback dan grup...");

            // Fetch feedback and groups in parallel
            const [feedbackRes, groupsRes] = await Promise.all([
                exportFeedbackData(),
                listAllGroups()
            ]);

            let data = feedbackRes?.data || [];

            // Get groups list
            let groups = [];
            if (groupsRes?.data && Array.isArray(groupsRes.data)) {
                groups = groupsRes.data;
            } else if (groupsRes?.groups && Array.isArray(groupsRes.groups)) {
                groups = groupsRes.groups;
            } else if (Array.isArray(groupsRes)) {
                groups = groupsRes;
            }

            // Fetch detailed group data to get members
            const groupsWithMembers = await Promise.all(groups.map(async (g) => {
                try {
                    const groupId = g.group_id || g.id || g.groupId;
                    if (!groupId) return g;
                    const detailRes = await getGroupById(groupId);
                    const detail = detailRes?.data || detailRes || {};
                    return { ...g, ...detail };
                } catch (e) {
                    return g;
                }
            }));

            // Create lookup: member name -> group name
            const memberToGroup = {};
            groupsWithMembers.forEach(g => {
                const groupName = g.group_name || g.name || 'Unknown';
                const members = g.members || g.group_members || g.users || [];
                members.forEach(m => {
                    const memberName = m.name || m.full_name || m.email;
                    if (memberName) {
                        memberToGroup[memberName] = groupName;
                    }
                });
            });

            // Enrich feedback data with group_name if missing
            data = data.map(fb => {
                if (!fb.group_name || fb.group_name === 'N/A') {
                    const reviewerName = fb.reviewer_name || fb.reviewer?.name;
                    fb.group_name = memberToGroup[reviewerName] || fb.group_name || 'N/A';
                }
                return fb;
            });

            if (data.length === 0) {
                this.showToast("Tidak ada data feedback untuk diekspor");
                return;
            }

            // Use xlsx library for multi-sheet Excel export
            const XLSX = await import("xlsx");
            const { utils, writeFile } = XLSX;

            const wb = utils.book_new();

            // --- SHEET 1: RAW DATA (All API fields, excluding 'group' object) ---
            const rawData = data.map(fb => {
                const { group, reviewer, reviewee, ...rest } = fb;
                return rest;
            });
            const wsRaw = utils.json_to_sheet(rawData);
            utils.book_append_sheet(wb, wsRaw, "Raw Data");

            // --- SHEET 2: CLEAN DATA (Formatted subset with specific columns) ---
            // Columns: Nama Tim, Reviewer, Reviewee, Kontribusi, Alasan
            const cleanData = data.map(fb => ({
                "Nama Tim": fb.group_name || 'N/A',
                "Reviewer": fb.reviewer_name || fb.reviewer?.name || 'N/A',
                "Reviewee": fb.reviewee_name || fb.reviewee?.name || 'N/A',
                "Kontribusi": fb.contribution_level || fb.contribution || 'N/A',
                "Alasan": fb.reason || 'N/A'
            }));

            const wsClean = utils.json_to_sheet(cleanData);
            utils.book_append_sheet(wb, wsClean, "Clean Data");

            // Generate and download Excel file
            writeFile(wb, `Feedback_360_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

            this.showToast("Data berhasil diekspor ke Excel (2 Sheets: Raw & Clean) ✅");
        } catch (error) {
            console.error("Error exporting feedback:", error);
            this.showToast("Gagal mengekspor data feedback.");
        }
    }

    async handleFeedbackSubmit(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const revieweeId = form.dataset.revieweeId;

        console.log("[DEBUG] Feedback Submission:", {
            revieweeId,
            formData: Object.fromEntries(formData.entries())
        });

        if (!revieweeId) {
            this.showToast("Error: Reviewee ID missing from form");
            return;
        }

        const payload = {
            reviewee_source_id: revieweeId,
            is_member_active: formData.get("is_member_active") === "true",
            contribution_level: formData.get("contribution_level"),
            reason: formData.get("reason")?.trim()
        };

        console.log("[DEBUG] Feedback Payload:", payload);

        if (!payload.contribution_level) {
            this.showFormFeedback(form, "Pilih tingkat kontribusi", true);
            return;
        }

        if (!payload.reason) {
            this.showFormFeedback(form, "Alasan wajib diisi", true);
            return;
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { submitFeedback } = await import("./services/groupService.js");
            await submitFeedback(payload);
            this.showToast("Penilaian berhasil dikirim ✅");
            form.reset();
            this.router.loadRoute(); // Refresh status list
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
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

    async handleAddMemberSubmit(form) {
        const formData = new FormData(form);
        const groupId = formData.get("group_id");
        const userId = formData.get("user_id")?.trim();

        if (!groupId || !userId) {
            this.showToast("Group ID dan User ID wajib diisi", true);
            return;
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { addMemberToGroup } = await import("./services/adminService.js");
            await addMemberToGroup(groupId, { user_id: userId });

            this.showToast("Anggota berhasil ditambahkan ✅");
            form.reset();

            // Hide modal
            const modal = document.getElementById("add-member-modal");
            if (modal) {
                modal.hidden = true;
                modal.style.display = "none";
            }

            // Reload page
            this.router.loadRoute();
        } catch (error) {
            this.applyApiErrors(form, error);
            this.showToast(error.message || "Gagal menambahkan anggota", true);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleRemoveMember(groupId, userId) {
        if (!confirm("Apakah Anda yakin ingin menghapus anggota ini dari tim?")) {
            return;
        }

        try {
            this.showToast("Menghapus anggota...", false);
            const { removeMemberFromGroup } = await import("./services/adminService.js");
            await removeMemberFromGroup(groupId, userId);

            this.showToast("Anggota berhasil dihapus dari tim 🗑️");

            // Reload page
            this.router.loadRoute();
        } catch (error) {
            console.error("Error removing member:", error);
            this.showToast(error.message || "Gagal menghapus anggota", true);
        }
    }

    openEditMemberModal(groupId, userId) {
        const modal = document.getElementById("edit-member-modal");
        if (modal) {
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                const userInput = form.querySelector('[name="user_id"]');
                const groupInput = form.querySelector('[name="group_id"]');
                if (userInput) userInput.value = userId;
                if (groupInput) groupInput.value = groupId;
            }
            modal.hidden = false;
            modal.style.display = "flex";
        } else {
            console.error("Edit Member Modal not found");
        }
    }

    async handleUpdateUserLearningPath(form) {
        const formData = new FormData(form);
        const userId = formData.get("user_id");
        const learningPath = formData.get("learning_path");

        if (!userId || !learningPath) {
            this.showToast("User ID dan Learning Path wajib diisi", true);
            return;
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { updateUserLearningPath } = await import("./services/adminService.js");
            await updateUserLearningPath(userId, { learning_path: learningPath });

            this.showToast("Learning Path berhasil diperbarui ✅");

            // Hide modal
            const modal = document.getElementById("edit-member-modal");
            if (modal) {
                modal.hidden = true;
                modal.style.display = "none";
            }

            // Reload page
            this.router.loadRoute();
        } catch (error) {
            console.error("Error updating learning path:", error);
            this.showToast(error.message || "Gagal memperbarui learning path", true);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    // Handle Search Groups
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

    setupTeamRegistrationValidation() {
        // Only run on team registration page
        if (!window.location.pathname.includes('/team-registration')) return;

        // Only run on team registration page
        if (!window.location.pathname.includes('/team-registration')) return;

        console.log("=== SETUP TEAM REGISTRATION VALIDATION ===");

        // Store rules data from component if available
        const rulesDataScript = document.querySelector('script[data-rules-data]');
        console.log("Rules data script found:", !!rulesDataScript);

        if (rulesDataScript) {
            try {
                const rulesData = JSON.parse(rulesDataScript.textContent);
                window.teamRegistrationRules = rulesData.rulesByUseCase || {};
                window.allRules = rulesData.rules || [];
                console.log('✅ Rules data loaded:', {
                    rulesByUseCase: window.teamRegistrationRules,
                    rulesByUseCaseKeys: Object.keys(window.teamRegistrationRules),
                    allRules: window.allRules,
                    allRulesCount: window.allRules.length
                });
            } catch (e) {
                console.error('❌ Failed to parse rules data:', e);
                console.error('Script content:', rulesDataScript.textContent);
            }
        } else {
            console.warn("⚠️ Rules data script not found!");
        }

        const memberIdsInput = document.querySelector('[data-member-ids-input]');
        const compositionStatus = document.querySelector('[data-composition-status]');
        const useCaseRadios = document.querySelectorAll('[data-use-case-radio]');
        const rulesContent = document.querySelector('[data-rules-content]');
        const rulesFooter = document.querySelector('[data-rules-footer]');
        const rulesCount = document.querySelector('[data-rules-count]');

        console.log("Elements found:", {
            memberIdsInput: !!memberIdsInput,
            compositionStatus: !!compositionStatus,
            useCaseRadios: useCaseRadios.length,
            rulesContent: !!rulesContent,
            rulesFooter: !!rulesFooter,
            rulesCount: !!rulesCount
        });

        // Handle use case selection to filter rules
        if (useCaseRadios.length > 0 && rulesContent) {
            console.log("Setting up use case radio handlers...");

            useCaseRadios.forEach((radio, index) => {
                // Remove existing listeners
                const newRadio = radio.cloneNode(true);
                radio.parentNode.replaceChild(newRadio, radio);

                newRadio.addEventListener('change', () => {
                    console.log(`Radio ${index} changed, checked:`, newRadio.checked);

                    if (newRadio.checked) {
                        const useCaseItem = newRadio.closest('[data-use-case-id]');
                        const useCaseId = useCaseItem?.getAttribute('data-use-case-id');

                        console.log('=== USE CASE SELECTED ===');
                        console.log('Use case ID:', useCaseId);
                        console.log('Available rules:', window.teamRegistrationRules);
                        console.log('Rules keys:', Object.keys(window.teamRegistrationRules || {}));

                        if (useCaseId && window.teamRegistrationRules) {
                            // Try exact match first
                            const useCaseIdStr = String(useCaseId).trim();
                            let rules = window.teamRegistrationRules[useCaseIdStr] || [];

                            // If no exact match, try case-insensitive
                            if (rules.length === 0) {
                                const matchingKey = Object.keys(window.teamRegistrationRules).find(key =>
                                    String(key).trim().toLowerCase() === useCaseIdStr.toLowerCase()
                                );
                                if (matchingKey) {
                                    rules = window.teamRegistrationRules[matchingKey] || [];
                                    console.log('✅ Found rules with case-insensitive match:', matchingKey);
                                }
                            }

                            console.log('Rules for use case:', useCaseIdStr, rules);
                            console.log('Rules count:', rules.length);

                            if (rules.length > 0) {
                                // Group rules by learning path
                                const groupedRules = {};
                                rules.forEach(rule => {
                                    const key = rule.attribute_value || 'other';
                                    if (!groupedRules[key]) {
                                        groupedRules[key] = [];
                                    }
                                    groupedRules[key].push(rule);
                                });

                                let rulesHtml = '';
                                Object.entries(groupedRules).forEach(([key, ruleGroup]) => {
                                    rulesHtml += ruleGroup.map(rule => {
                                        const attributeValue = rule.attribute_value || '';
                                        const operator = rule.operator || '';
                                        const value = rule.value || '';

                                        let icon = '📌';
                                        let label = '';

                                        if (attributeValue) {
                                            const valueLower = attributeValue.toLowerCase();
                                            if (valueLower.includes('machine learning') || valueLower.includes('ml')) {
                                                icon = '🤖';
                                                label = 'Machine Learning';
                                            } else if (valueLower.includes('front-end') || valueLower.includes('back-end') || valueLower.includes('febe') || valueLower.includes('web & back-end')) {
                                                icon = '💻';
                                                label = 'Front-End & Back-End';
                                            } else if (valueLower.includes('react & back-end')) {
                                                icon = '⚛️';
                                                label = 'React & Back-End';
                                            } else if (valueLower.includes('cloud computing') || valueLower.includes('cloud')) {
                                                icon = '☁️';
                                                label = 'Cloud Computing';
                                            } else {
                                                label = attributeValue;
                                            }
                                        }

                                        const opLabel = this.getRuleOperatorLabel(operator);

                                        return `
                      <div class="rule-item" data-rule-id="${rule.id}">
                        <div class="rule-item-header">
                          <span class="rule-icon">${icon}</span>
                          <span class="rule-label">${label}</span>
                        </div>
                        <div class="rule-item-body">
                          <span class="rule-operator">${opLabel}</span>
                          <span class="rule-value">${value} orang</span>
                        </div>
                      </div>
                    `;
                                    }).join('');
                                });

                                console.log('Updating rules content with', rules.length, 'rules');
                                rulesContent.innerHTML = rulesHtml;
                                if (rulesCount) {
                                    rulesCount.textContent = `${rules.length} Aturan`;
                                }
                                if (rulesFooter) {
                                    rulesFooter.hidden = false;
                                }
                            } else {
                                console.log('No rules found for this use case');
                                rulesContent.innerHTML = '<div class="rules-placeholder"><p class="rules-placeholder-text">Tidak ada aturan untuk use case ini</p></div>';
                                if (rulesCount) {
                                    rulesCount.textContent = '0 Aturan';
                                }
                                if (rulesFooter) {
                                    rulesFooter.hidden = true;
                                }
                            }
                        } else {
                            console.warn('Missing useCaseId or rules data:', { useCaseId, hasRules: !!window.teamRegistrationRules });
                        }
                    }
                });
            });

            console.log("✅ Use case radio handlers set up");
        } else {
            console.warn("⚠️ Cannot set up handlers:", {
                hasRadios: useCaseRadios.length > 0,
                hasRulesContent: !!rulesContent
            });
        }

        console.log("=== END SETUP TEAM REGISTRATION VALIDATION ===");

        if (!memberIdsInput || !compositionStatus) return;

        // Remove existing listener if any
        const newInput = memberIdsInput.cloneNode(true);
        memberIdsInput.parentNode.replaceChild(newInput, memberIdsInput);

        let validationTimeout;

        newInput.addEventListener('input', () => {
            clearTimeout(validationTimeout);
            const memberIds = newInput.value.split(',').map(id => id.trim()).filter(id => id.length > 0);

            if (memberIds.length === 0) {
                compositionStatus.hidden = true;
                return;
            }

            // Show validation status
            compositionStatus.hidden = false;
            const statusText = compositionStatus.querySelector('.status-text');
            const statusIcon = compositionStatus.querySelector('.status-icon');

            if (statusText && statusIcon) {
                statusText.textContent = 'Memvalidasi komposisi tim...';
                statusIcon.textContent = '⏳';
            }

            // Debounce validation
            validationTimeout = setTimeout(() => {
                if (statusText && statusIcon) {
                    statusText.textContent = `Komposisi tim akan divalidasi saat submit. Pastikan ${memberIds.length} anggota memenuhi aturan di sidebar.`;
                    statusIcon.textContent = 'ℹ️';
                }
            }, 500);
        });
    }

    getRuleOperatorLabel(operator) {
        const labels = {
            '>=': 'minimal',
            '<=': 'maksimal',
            '==': 'sama dengan',
            '>': 'lebih dari',
            '<': 'kurang dari'
        };
        return labels[operator] || operator;
    }

    async handleRegistrationPeriod(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const startDate = formData.get("start_date");
        const endDate = formData.get("end_date");
        const isActive = formData.get("is_active") === "on";

        if (!startDate || !endDate) {
            this.showFormFeedback(form, "Tanggal mulai dan berakhir wajib diisi", true);
            return;
        }

        const payload = {
            start_date: new Date(startDate).toISOString(),
            end_date: new Date(endDate).toISOString(),
            is_active: isActive,
        };

        try {
            this.toggleSubmitLoading(form, true);
            const { setRegistrationPeriod } = await import("./services/adminService.js");
            await setRegistrationPeriod(payload);
            this.showToast("Periode pendaftaran berhasil disimpan ✅");
            this.closeModal();
            form.reset();
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleRandomizeTeams(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const batchId = formData.get("batch_id")?.trim();
        const teamSize = parseInt(formData.get("team_size")) || 5;
        const respectLearningPath = formData.get("respect_learning_path") === "on";


        if (!batchId) {
            this.showFormFeedback(form, "Batch ID wajib diisi", true);
            return;
        }

        const payload = {
            batch_id: batchId,
            team_size: teamSize,
            respect_learning_path: respectLearningPath,
        };

        try {
            this.toggleSubmitLoading(form, true);
            const { randomizeTeams } = await import("./services/adminService.js");
            const response = await randomizeTeams(payload);
            this.showToast(`Randomize berhasil! ${response?.data?.teams_created || 0} tim telah dibuat ✅`);
            this.closeModal();
            form.reset();
            this.router.loadRoute();
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleUploadMembers(form) {
        this.resetFormState(form);
        const formData = new FormData(form);
        const groupId = formData.get("group_id");
        const memberIdsText = formData.get("member_ids")?.trim();

        if (!groupId || !memberIdsText) {
            this.showFormFeedback(form, "Group ID dan ID anggota wajib diisi", true);
            return;
        }

        // Parse member IDs (support comma and newline separated)
        const memberIds = memberIdsText
            .split(/[,\n]/)
            .map(id => id.trim())
            .filter(id => id.length > 0);

        if (memberIds.length === 0) {
            this.showFormFeedback(form, "Minimal satu ID anggota harus diisi", true);
            return;
        }

        const payload = {
            member_source_ids: memberIds,
        };

        try {
            this.toggleSubmitLoading(form, true);
            const { uploadTeamMembers } = await import("./services/adminService.js");
            await uploadTeamMembers(groupId, payload);
            this.showToast(`${memberIds.length} anggota berhasil ditambahkan ✅`);
            this.closeModal();
            form.reset();
            this.router.loadRoute();
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    async handleCreatePeriod(form) {
        this.resetFormState(form);
        const formData = new FormData(form);

        const payload = {
            title: formData.get("title")?.trim(),
            start_date: formData.get("start_date"),
            end_date: formData.get("end_date"),
            batch_id: formData.get("batch_id")?.trim()
        };

        if (!payload.title || !payload.start_date || !payload.end_date || !payload.batch_id) {
            this.showFormFeedback(form, "Mohon lengkapi semua field wajib", true);
            return;
        }

        try {
            this.toggleSubmitLoading(form, true);
            const { createPeriod } = await import("./services/adminService.js");
            await createPeriod(payload);
            this.showToast("Periode berhasil dibuat ✅");
            this.closeModal();
            form.reset();
            // Reload periods list in the modal manually or via router if needed. 
            // For now, simple close is better. Extensibility: broadcast event.
        } catch (error) {
            this.applyApiErrors(form, error);
        } finally {
            this.toggleSubmitLoading(form, false);
        }
    }

    openUploadMembersModal(groupId) {
        const modal = document.querySelector('[data-modal="upload-members"]');
        const backdrop = document.querySelector("[data-modal-backdrop]");
        const form = modal?.querySelector('form');

        if (modal && backdrop && form) {
            form.querySelector('[name="group_id"]').value = groupId;
            modal.hidden = false;
            backdrop.hidden = false;
        }
    }
}


// Start the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    new App();
});