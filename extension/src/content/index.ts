import { LinkedInAdapter } from './adapters/linkedin_adapter';
import { NaukriAdapter } from './adapters/naukri_adapter';
import { GenericAdapter } from './adapters/generic_adapter';
import { floatingBadge } from './floating_badge';
import { fieldDetector } from './autofill/field_detector';
import { stagedInjector } from './autofill/staged_injector';
import { apiClient } from '../shared/api_client';
import { getAuthToken } from '../shared/storage';
import { ApplicationMethod, JobMatch } from '../shared/types';

async function initContentScript() {
  const token = await getAuthToken();
  if (!token) {
    // User not logged into extension yet
    return;
  }

  const adapters = [new LinkedInAdapter(), new NaukriAdapter(), new GenericAdapter()];
  const currentUrl = window.location.href;
  const adapter = adapters.find(a => a.isCompatible(currentUrl)) || adapters[2];

  let currentJobId: string | null = null;
  let currentMethod: ApplicationMethod = 'WEBSITE_FORM';

  async function processCurrentJob() {
    try {
      const payload = await adapter.extractJob();
      if (!payload || !payload.title) return;

      // Ingest job & match
      const response = await apiClient.ingestJob(payload);
      const match: JobMatch = response.match;
      currentJobId = response.job.id;
      currentMethod = response.workflow.method;

      // Render floating badge
      floatingBadge.render({
        match,
        method: currentMethod,
        onPrepare: handlePrepareApplication,
        onSave: async () => {
          if (currentJobId) await apiClient.toggleSaveJob(currentJobId);
        }
      });
    } catch (e) {
      console.warn('AI Assistant job extraction skipped:', e);
    }
  }

  async function handlePrepareApplication() {
    if (!currentJobId) return;

    try {
      // 1. If form workflow, detect fields first
      if (currentMethod === 'WEBSITE_FORM') {
        const detectedFields = fieldDetector.findFormFields();
        const questions = detectedFields
          .filter(f => f.fieldType === 'question')
          .map(f => ({
            field_id: f.element.id || f.label,
            question: f.label,
            max_chars: f.maxChars
          }));

        const draft = await apiClient.draftWorkflow(currentJobId, 'WEBSITE_FORM', questions);
        const profile = await apiClient.getProfile();

        const qaList = (draft.form_qa_answers || []).map(a => ({
          field_id: a.field_id,
          answer: a.answer
        }));

        const { filledCount, missingRequired } = stagedInjector.injectProfileData(detectedFields, profile, qaList);
        alert(`Application Form Staged:\n• ${filledCount} fields populated\n• ${missingRequired} required fields need manual attention\n\nNote: Please review all fields and click Submit manually when ready.`);
      } else {
        // Email, Recruiter message, or External Portal
        const draft = await apiClient.draftWorkflow(currentJobId, currentMethod);
        showDraftReviewModal(draft, currentMethod);
      }
    } catch (err: any) {
      alert(`Error preparing application: ${err.message}`);
    }
  }

  function showDraftReviewModal(draft: any, method: ApplicationMethod) {
    const existing = document.getElementById('ai-draft-review-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ai-draft-review-modal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000000';
    overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    let contentHtml = '';
    if (method === 'EMAIL' && draft.email_draft) {
      contentHtml = `
        <h3 style="margin-top: 0; color: #F8FAFC;">✉️ Prepared Email Application</h3>
        <p style="font-size: 13px; color: #94A3B8;">Review the tailored email before sending with your client.</p>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">Recipient</label>
          <input type="text" readonly value="${draft.email_draft.to}" style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 12px;">
          <label style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">Subject Line</label>
          <input type="text" readonly value="${draft.email_draft.subject}" style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">Cover Email Body</label>
          <textarea rows="7" readonly style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box; resize: vertical;">${draft.email_draft.body}</textarea>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="ai-modal-copy-btn" style="background: #3B82F6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Copy Email Body</button>
          <button id="ai-modal-close-btn" style="background: #334155; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
      `;
    } else if (method === 'RECRUITER_MESSAGE' && draft.recruiter_message_draft) {
      contentHtml = `
        <h3 style="margin-top: 0; color: #F8FAFC;">💬 Recruiter Outreach Note</h3>
        <p style="font-size: 13px; color: #94A3B8;">Character count: ${draft.recruiter_message_draft.char_count} / 300</p>
        <textarea rows="4" readonly style="width: 100%; padding: 8px; background: #1E293B; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box;">${draft.recruiter_message_draft.message}</textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
          <button id="ai-modal-copy-btn" style="background: #3B82F6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Copy Message</button>
          <button id="ai-modal-close-btn" style="background: #334155; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div style="background: #0F172A; border: 1px solid #334155; border-radius: 16px; padding: 24px; width: 480px; max-width: 90vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        ${contentHtml}
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('ai-modal-close-btn')?.addEventListener('click', () => overlay.remove());
    document.getElementById('ai-modal-copy-btn')?.addEventListener('click', () => {
      const textToCopy = method === 'EMAIL' ? draft.email_draft.body : draft.recruiter_message_draft.message;
      navigator.clipboard.writeText(textToCopy);
      alert('Copied to clipboard! You can paste and send manually.');
      overlay.remove();
    });
  }

  // Initial trigger and observer setup
  processCurrentJob();
  adapter.observeJobChanges(processCurrentJob);
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}
