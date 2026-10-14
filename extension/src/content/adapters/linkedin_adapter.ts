import { JobSourceAdapter } from './base_adapter';
import { ExtractedJobPayload } from '../../shared/types';

export class LinkedInAdapter implements JobSourceAdapter {
  isCompatible(url: string): boolean {
    return url.includes('linkedin.com/jobs') || url.includes('linkedin.com/feed');
  }

  async extractJob(): Promise<ExtractedJobPayload | null> {
    // 1. Title
    const titleEl = document.querySelector(
      '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24, .jobs-details__main-content h1'
    );
    const title = titleEl?.textContent?.trim();
    if (!title) return null;

    // 2. Company
    const companyEl = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__primary-description-container a'
    );
    const company = companyEl?.textContent?.trim() || 'LinkedIn Listing';

    // 3. Location
    const locationEl = document.querySelector(
      '.job-details-jobs-unified-top-card__primary-description-container, .jobs-unified-top-card__bullet'
    );
    const location = locationEl?.textContent?.trim() || 'Unknown Location';

    // 4. Description
    const descEl = document.querySelector('.jobs-description__content, #job-details, .jobs-box__html-content');
    const descriptionText = descEl?.textContent?.trim() || '';

    // 5. External Job ID from URL or DOM
    const urlParams = new URLSearchParams(window.location.search);
    const currentJobId = urlParams.get('currentJobId') || window.location.pathname.split('/').filter(Boolean).pop() || '';

    // 6. Recency Parsing (e.g. "1 hour ago", "3 days ago")
    const recencyEl = document.querySelector('.jobs-unified-top-card__posted-date, .job-details-jobs-unified-top-card__primary-description-container span');
    const recencyText = recencyEl?.textContent?.trim() || '';
    const sourcePostedAt = this.parseRelativeTime(recencyText);

    // 7. Apply Button & Easy Apply Detection
    const applyBtn = document.querySelector('.jobs-apply-button, button[data-control-name="jobdetails_topcard_inapply"]');
    const applyBtnText = applyBtn?.textContent?.trim() || '';
    const hasEasyApply = applyBtnText.toLowerCase().includes('easy apply') || document.querySelector('.jobs-apply-button--easy-apply') !== null;

    // 8. Extract skills from text
    const skillsRequired = this.extractSkills(descriptionText);

    return {
      source_id: 'linkedin',
      external_job_id: currentJobId,
      title,
      company,
      location,
      employment_type: 'Full-time',
      description_text: descriptionText,
      skills_required: skillsRequired,
      application_url: window.location.href,
      source_posted_at: sourcePostedAt,
      raw_page_snippets: {
        apply_button_text: applyBtnText,
        has_easy_apply: hasEasyApply,
        recency_raw: recencyText
      }
    };
  }

  observeJobChanges(onJobChange: () => void): void {
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(onJobChange, 800); // Allow DOM to hydrate
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private parseRelativeTime(text: string): string | undefined {
    const now = new Date();
    const lower = text.toLowerCase();
    
    const hourMatch = lower.match(/(\d+)\s*hour/);
    if (hourMatch) {
      now.setHours(now.getHours() - parseInt(hourMatch[1], 10));
      return now.toISOString();
    }

    const dayMatch = lower.match(/(\d+)\s*day/);
    if (dayMatch) {
      now.setDate(now.getDate() - parseInt(dayMatch[1], 10));
      return now.toISOString();
    }

    const weekMatch = lower.match(/(\d+)\s*week/);
    if (weekMatch) {
      now.setDate(now.getDate() - (parseInt(weekMatch[1], 10) * 7));
      return now.toISOString();
    }

    return undefined;
  }

  private extractSkills(text: string): string[] {
    const common = [
      'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'FastAPI', 'Docker',
      'Kubernetes', 'PostgreSQL', 'SQL', 'AWS', 'GCP', 'Azure', 'Git', 'REST API',
      'Java', 'C++', 'Go', 'Rust', 'GraphQL', 'Next.js', 'Tailwind', 'Redis'
    ];
    return common.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(text));
  }
}
