import { apiClient } from '../shared/api_client';
import { getSettings, saveSettings } from '../shared/storage';
import { Job } from '../shared/types';

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation
  const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item');
  const viewSections = document.querySelectorAll<HTMLElement>('.view-section');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      viewSections.forEach(sec => {
        if (sec.id === `view-${targetView}`) {
          sec.style.display = 'block';
        } else {
          sec.style.display = 'none';
        }
      });

      if (targetView === 'feed') loadJobs();
      if (targetView === 'tracker') loadTracker();
      if (targetView === 'profile') loadProfile();
    });
  });

  // State
  let currentRecency = 'all';
  let currentSort = 'best_match';
  let currentSearch = '';

  // Initialize
  await initUser();
  await loadJobs();

  async function initUser() {
    try {
      const user = await apiClient.getMe();
      const userNameEl = document.getElementById('sidebar-user-name');
      const initialsEl = document.getElementById('avatar-initials');
      if (userNameEl) userNameEl.textContent = user.full_name || user.email;
      if (initialsEl) initialsEl.textContent = (user.full_name || 'U').charAt(0).toUpperCase();
    } catch (_) {
      console.log('User not signed in via extension yet.');
    }
  }

  // --- JOB FEED ---
  const recencyChips = document.querySelectorAll('#recency-chips button');
  recencyChips.forEach(chip => {
    chip.addEventListener('click', () => {
      recencyChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentRecency = chip.getAttribute('data-recency') || 'all';
      loadJobs();
    });
  });

  const sortSelect = document.getElementById('sort-jobs-select') as HTMLSelectElement;
  sortSelect?.addEventListener('change', () => {
    currentSort = sortSelect.value;
    loadJobs();
  });

  const searchInput = document.getElementById('search-jobs-input') as HTMLInputElement;
  let searchTimeout: any;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = searchInput.value;
      loadJobs();
    }, 300);
  });

  async function loadJobs() {
    const container = document.getElementById('jobs-container');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--text-secondary); grid-column: 1/-1; padding: 40px; text-align: center;">Loading jobs...</div>';

    try {
      const settings = await getSettings();
      const jobs = await apiClient.getJobs({
        recency_window: currentRecency,
        sort_by: currentSort,
        search: currentSearch,
        min_match_score: settings.minMatchScore
      });

      if (jobs.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
            <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
            <div style="font-size: 16px; font-weight: 700; color: white;">No matching jobs found</div>
            <p style="font-size: 13px; margin-top: 6px;">Browse LinkedIn or Naukri, or click "+ Add Job Manually" to test matching.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = jobs.map(job => renderJobCard(job)).join('');
      attachJobCardEvents(jobs);
    } catch (err: any) {
      container.innerHTML = `<div style="color: var(--accent-rose); grid-column: 1/-1; padding: 20px;">Failed to load jobs: ${err.message}</div>`;
    }
  }

  function renderJobCard(job: Job): string {
    const score = job.match?.match_score || 0;
    const scoreClass = score >= 80 ? 'score-high' : (score >= 60 ? 'score-mid' : 'score-low');
    
    // Recency display
    const postedTime = job.source_posted_at 
      ? `Posted: ${new Date(job.source_posted_at).toLocaleDateString()}` 
      : `Discovered: ${new Date(job.discovered_at).toLocaleDateString()}`;

    return `
      <div class="job-card" data-job-id="${job.id}">
        <div class="job-top">
          <div>
            <h3 class="job-title">${job.title}</h3>
            <div class="job-company">${job.company} • ${job.location || 'Remote'}</div>
          </div>
          <span class="score-pill ${scoreClass}">${score}% Fit</span>
        </div>

        <div class="job-meta">
          <span class="meta-tag">📅 ${postedTime}</span>
          <span class="meta-tag">🌐 ${job.source_id.toUpperCase()}</span>
          <span class="meta-tag">💼 ${formatMethodLabel(job.detected_method || 'WEBSITE_FORM')}</span>
        </div>

        <div class="job-match-reason">
          ${job.match?.summary_explanation || 'Match calculated based on candidate skills and role preference.'}
        </div>

        <div class="job-actions">
          <button class="btn-action-primary btn-prepare-app" data-id="${job.id}">Prepare Application</button>
          ${job.application_url ? `<a href="${job.application_url}" target="_blank" class="btn-action-secondary" style="text-decoration: none;">View ↗</a>` : ''}
          <button class="btn-action-secondary btn-save-job" data-id="${job.id}">${job.is_saved ? '★' : '☆'}</button>
        </div>
      </div>
    `;
  }

  function formatMethodLabel(method: string): string {
    switch (method) {
      case 'EMAIL': return 'Email Apply';
      case 'RECRUITER_MESSAGE': return 'Recruiter Note';
      case 'EXTERNAL_PORTAL': return 'External Portal';
      default: return 'Form Autofill';
    }
  }

  function attachJobCardEvents(jobs: Job[]) {
    document.querySelectorAll('.btn-prepare-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const job = jobs.find(j => j.id === jobId);
        if (job) openWorkflowModal(job);
      });
    });

    document.querySelectorAll('.btn-save-job').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const jobId = target.getAttribute('data-id');
        if (jobId) {
          const res = await apiClient.toggleSaveJob(jobId);
          target.textContent = res.is_saved ? '★' : '☆';
        }
      });
    });
  }

  // --- WORKFLOW MODAL ---
  const modal = document.getElementById('workflow-modal')!;
  const modalBody = document.getElementById('workflow-modal-body')!;

  async function openWorkflowModal(job: Job) {
    modal.style.display = 'flex';
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 24px; margin-bottom: 12px;">⚡</div>
        <h3>Drafting Tailored Application...</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-top: 6px;">
          Grounding answers strictly in verified candidate profile facts.
        </p>
      </div>
    `;

    try {
      const draft = await apiClient.draftWorkflow(job.id, job.detected_method);
      renderWorkflowDraftModal(job, draft);
    } catch (err: any) {
      modalBody.innerHTML = `
        <h3 style="color: var(--accent-rose);">Drafting Failed</h3>
        <p style="color: var(--text-secondary); margin: 12px 0;">${err.message}</p>
        <button class="btn-action-secondary" id="modal-close-btn">Close</button>
      `;
      document.getElementById('modal-close-btn')?.addEventListener('click', () => modal.style.display = 'none');
    }
  }

  function renderWorkflowDraftModal(job: Job, draft: any) {
    const isEmail = draft.workflow_type === 'EMAIL';
    const isRecruiter = draft.workflow_type === 'RECRUITER_MESSAGE';

    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 800;">${job.title}</h2>
          <div style="font-size: 13px; color: var(--accent-cyan); font-weight: 600;">${job.company}</div>
        </div>
        <button id="modal-close-x" style="background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer;">&times;</button>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; margin-bottom: 20px;">
        <label style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-dim); display: block; margin-bottom: 6px;">Application Method</label>
        <span style="font-size: 13px; font-weight: 600; color: white;">${formatMethodLabel(draft.workflow_type)}</span>
      </div>

      ${isEmail && draft.email_draft ? `
        <div style="margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">Recipient</label>
          <input type="text" class="search-input" readonly value="${draft.email_draft.to}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">Subject Line</label>
          <input type="text" class="search-input" readonly value="${draft.email_draft.subject}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">Email Body</label>
          <textarea rows="8" class="search-input" readonly style="width: 100%; resize: vertical;">${draft.email_draft.body}</textarea>
        </div>
      ` : ''}

      ${isRecruiter && draft.recruiter_message_draft ? `
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 6px;">
            Connection Note (${draft.recruiter_message_draft.char_count} / 300 characters)
          </label>
          <textarea rows="4" class="search-input" readonly style="width: 100%; resize: vertical;">${draft.recruiter_message_draft.message}</textarea>
        </div>
      ` : ''}

      ${!isEmail && !isRecruiter && draft.form_qa_answers ? `
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 8px;">
            Fact-Grounded Form Answers
          </label>
          ${draft.form_qa_answers.map((qa: any) => `
            <div style="margin-bottom: 12px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 10px;">
              <div style="font-size: 12px; font-weight: 700; margin-bottom: 4px;">${qa.question}</div>
              <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${qa.answer}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="border-top: 1px solid var(--border-subtle); padding-top: 18px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; color: var(--text-dim);">
          ⚠️ Final submission is manual. Verify before sending.
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-action-primary" id="btn-confirm-applied">✓ Confirm Applied Manually</button>
          <button class="btn-action-secondary" id="modal-close-btn">Close</button>
        </div>
      </div>
    `;

    document.getElementById('modal-close-x')?.addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('modal-close-btn')?.addEventListener('click', () => modal.style.display = 'none');

    document.getElementById('btn-confirm-applied')?.addEventListener('click', async () => {
      await apiClient.updateApplicationStatus(draft.application_id, 'APPLIED');
      modal.style.display = 'none';
      alert('Application tracked as APPLIED! Good luck.');
      loadJobs();
    });
  }

  // --- MANUAL JOB ADD ---
  document.getElementById('btn-manual-job-add')?.addEventListener('click', () => {
    modal.style.display = 'flex';
    modalBody.innerHTML = `
      <h3 style="margin-bottom: 16px;">Add Job Manually</h3>
      <form id="manual-job-form">
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Job Title</label>
          <input type="text" id="manual-title" class="search-input" style="width: 100%;" required placeholder="Senior Software Engineer">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Company</label>
          <input type="text" id="manual-company" class="search-input" style="width: 100%;" required placeholder="Google / Stripe">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Job Description</label>
          <textarea id="manual-desc" rows="6" class="search-input" style="width: 100%; resize: vertical;" required placeholder="Paste full job description..."></textarea>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="submit" class="btn-action-primary" id="btn-save-manual">Calculate Match & Save</button>
          <button type="button" class="btn-action-secondary" id="manual-cancel-btn">Cancel</button>
        </div>
      </form>
    `;

    document.getElementById('manual-cancel-btn')?.addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('manual-job-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = (document.getElementById('manual-title') as HTMLInputElement).value;
      const company = (document.getElementById('manual-company') as HTMLInputElement).value;
      const desc = (document.getElementById('manual-desc') as HTMLTextAreaElement).value;

      try {
        await apiClient.ingestJob({
          source_id: 'manual',
          title,
          company,
          description_text: desc,
          skills_required: [],
          raw_page_snippets: {}
        });
        modal.style.display = 'none';
        loadJobs();
      } catch (err: any) {
        alert(`Failed to save job: ${err.message}`);
      }
    });
  });

  // --- APPLICATION TRACKER ---
  async function loadTracker() {
    const tbody = document.getElementById('tracker-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">Loading applications...</td></tr>';

    try {
      const apps = await apiClient.listApplications();
      if (apps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">No applications tracked yet. Discovered jobs can be prepared and tracked here.</td></tr>';
        return;
      }

      tbody.innerHTML = apps.map(app => `
        <tr>
          <td>
            <div style="font-weight: 700;">${app.job?.title || 'Job Application'}</div>
            <div style="font-size: 12px; color: var(--accent-cyan);">${app.job?.company || ''}</div>
          </td>
          <td><span style="font-size: 12px;">${formatMethodLabel(app.detected_method)}</span></td>
          <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
          <td style="color: var(--text-secondary); font-size: 12px;">${app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Not yet'}</td>
          <td style="color: var(--text-secondary); font-size: 12px;">${app.next_followup_at ? new Date(app.next_followup_at).toLocaleDateString() : 'None scheduled'}</td>
          <td>
            <select class="app-status-select" data-id="${app.id}" style="padding: 6px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 12px;">
              <option value="NEW" ${app.status === 'NEW' ? 'selected' : ''}>NEW</option>
              <option value="SHORTLISTED" ${app.status === 'SHORTLISTED' ? 'selected' : ''}>SHORTLISTED</option>
              <option value="READY_TO_APPLY" ${app.status === 'READY_TO_APPLY' ? 'selected' : ''}>READY_TO_APPLY</option>
              <option value="DRAFTED" ${app.status === 'DRAFTED' ? 'selected' : ''}>DRAFTED</option>
              <option value="APPLIED" ${app.status === 'APPLIED' ? 'selected' : ''}>APPLIED</option>
              <option value="INTERVIEW" ${app.status === 'INTERVIEW' ? 'selected' : ''}>INTERVIEW</option>
              <option value="OFFER" ${app.status === 'OFFER' ? 'selected' : ''}>OFFER</option>
              <option value="REJECTED" ${app.status === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
            </select>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.app-status-select').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const target = e.currentTarget as HTMLSelectElement;
          const appId = target.getAttribute('data-id');
          if (appId) {
            await apiClient.updateApplicationStatus(appId, target.value);
            loadTracker();
          }
        });
      });
    } catch (err: any) {
      tbody.innerHTML = `<tr><td colspan="6" style="color: var(--accent-rose); padding: 20px;">Failed to load tracker: ${err.message}</td></tr>`;
    }
  }

  // CSV Export
  document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
    const settings = await getSettings();
    window.open(`${settings.apiBaseUrl}/applications/export/csv?token=${settings.token}`, '_blank');
  });

  // --- CANDIDATE PROFILE & RESUMES ---
  async function loadProfile() {
    try {
      const profile = await apiClient.getProfile();
      (document.getElementById('profile-headline') as HTMLInputElement).value = profile.headline || '';
      (document.getElementById('profile-phone') as HTMLInputElement).value = profile.phone || '';
      
      const skillsStr = (profile.skills || []).map(s => typeof s === 'string' ? s : s.name).join(', ');
      (document.getElementById('profile-skills') as HTMLInputElement).value = skillsStr;
      
      (document.getElementById('profile-verified-facts') as HTMLTextAreaElement).value = JSON.stringify(profile.verified_facts || {}, null, 2);

      // Load resumes
      const resumes = await apiClient.listResumes();
      const resumeContainer = document.getElementById('resumes-list-container')!;
      if (resumes.length === 0) {
        resumeContainer.innerHTML = '<div style="font-size: 12px; color: var(--text-secondary);">No resume versions uploaded.</div>';
      } else {
        resumeContainer.innerHTML = resumes.map(r => `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 10px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px; font-weight: 600;">${r.version_name}</div>
              <div style="font-size: 11px; color: var(--text-secondary);">${r.filename}</div>
            </div>
            ${r.is_primary ? '<span style="font-size: 10px; background: rgba(56,189,248,0.2); color: var(--accent-cyan); padding: 2px 6px; border-radius: 10px;">Primary</span>' : ''}
          </div>
        `).join('');
      }
    } catch (err: any) {
      console.warn('Profile load error:', err);
    }
  }

  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const headline = (document.getElementById('profile-headline') as HTMLInputElement).value;
    const phone = (document.getElementById('profile-phone') as HTMLInputElement).value;
    const skillsRaw = (document.getElementById('profile-skills') as HTMLInputElement).value;
    const factsRaw = (document.getElementById('profile-verified-facts') as HTMLTextAreaElement).value;

    const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
    let verifiedFacts = {};
    try {
      verifiedFacts = JSON.parse(factsRaw);
    } catch (_) {}

    try {
      await apiClient.updateProfile({
        headline,
        phone,
        skills,
        verified_facts: verifiedFacts
      });
      alert('Candidate Profile updated successfully!');
    } catch (err: any) {
      alert(`Failed to save profile: ${err.message}`);
    }
  });

  document.getElementById('resume-upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('resume-file-input') as HTMLInputElement;
    const versionNameInput = document.getElementById('resume-version-name') as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('version_name', versionNameInput.value || 'Main Resume');
    formData.append('is_primary', 'true');

    try {
      const uploadBtn = document.getElementById('upload-resume-btn')!;
      uploadBtn.textContent = 'Parsing Resume Facts...';
      const result = await apiClient.uploadResume(formData);
      alert(result.message);
      loadProfile();
    } catch (err: any) {
      alert(`Resume upload failed: ${err.message}`);
    } finally {
      document.getElementById('upload-resume-btn')!.textContent = 'Upload & Parse';
    }
  });

  // --- SETTINGS ---
  const settingsBtn = document.getElementById('save-settings-btn');
  settingsBtn?.addEventListener('click', async () => {
    const apiUrl = (document.getElementById('settings-api-url') as HTMLInputElement).value;
    const minScore = parseInt((document.getElementById('settings-min-score') as HTMLInputElement).value, 10);
    await saveSettings({
      apiBaseUrl: apiUrl,
      minMatchScore: isNaN(minScore) ? 70 : minScore
    });
    alert('Settings saved!');
  });

  document.getElementById('btn-delete-all-data')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to permanently delete all profile facts, stored resumes, and application records?')) {
      await apiClient.deleteProfile();
      alert('All stored data has been erased.');
      loadProfile();
      loadJobs();
    }
  });
});
