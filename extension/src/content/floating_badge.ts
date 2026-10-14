import { JobMatch, ApplicationMethod } from '../shared/types';

export class FloatingBadge {
  private container: HTMLDivElement | null = null;

  render(params: {
    match: JobMatch;
    method: ApplicationMethod;
    onPrepare: () => void;
    onSave: () => void;
  }): void {
    if (this.container) {
      this.container.remove();
    }

    const div = document.createElement('div');
    div.id = 'ai-job-assistant-badge';
    div.style.position = 'fixed';
    div.style.bottom = '24px';
    div.style.right = '24px';
    div.style.zIndex = '999999';
    div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    div.style.backgroundColor = 'rgba(15, 23, 42, 0.92)';
    div.style.backdropFilter = 'blur(16px)';
    div.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    div.style.borderRadius = '16px';
    div.style.padding = '18px 20px';
    div.style.color = '#F8FAFC';
    div.style.boxShadow = '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)';
    div.style.width = '320px';
    div.style.animation = 'aiBadgeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    const scoreColor = params.match.match_score >= 80 ? '#10B981' : (params.match.match_score >= 60 ? '#F59E0B' : '#EF4444');
    
    div.innerHTML = `
      <style>
        @keyframes aiBadgeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-btn-primary {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }
        .ai-btn-primary:hover {
          filter: brightness(1.1);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .ai-badge-close {
          cursor: pointer;
          color: #94A3B8;
          font-size: 16px;
          line-height: 1;
        }
        .ai-badge-close:hover {
          color: white;
        }
      </style>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #38BDF8; box-shadow: 0 0 8px #38BDF8;"></div>
          <span style="font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; color: #94A3B8;">AI Job Match</span>
        </div>
        <span class="ai-badge-close" id="ai-badge-close-btn">&times;</span>
      </div>

      <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px;">
        <span style="font-size: 32px; font-weight: 800; color: ${scoreColor}; font-feature-settings: 'tnum';">${params.match.match_score}%</span>
        <span style="font-size: 12px; font-weight: 600; color: #CBD5E1; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 20px;">
          ${this.formatMethod(params.method)}
        </span>
      </div>

      <p style="font-size: 12px; line-height: 1.5; color: #94A3B8; margin: 0 0 14px 0;">
        ${params.match.summary_explanation.slice(0, 110)}...
      </p>

      <div style="display: flex; gap: 8px;">
        <button class="ai-btn-primary" id="ai-badge-prepare-btn">Prepare Application</button>
      </div>
    `;

    document.body.appendChild(div);
    this.container = div;

    document.getElementById('ai-badge-close-btn')?.addEventListener('click', () => {
      this.remove();
    });

    document.getElementById('ai-badge-prepare-btn')?.addEventListener('click', () => {
      params.onPrepare();
    });
  }

  remove(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  private formatMethod(method: ApplicationMethod): string {
    switch (method) {
      case 'EMAIL': return '✉️ Email Application';
      case 'WEBSITE_FORM': return '📝 Website Form';
      case 'RECRUITER_MESSAGE': return '💬 Recruiter Message';
      case 'EXTERNAL_PORTAL': return '🌐 External ATS';
      default: return '❓ Method Unclear';
    }
  }
}

export const floatingBadge = new FloatingBadge();
