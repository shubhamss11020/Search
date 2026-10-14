import { JobSourceAdapter } from './base_adapter';
import { ExtractedJobPayload } from '../../shared/types';

export class NaukriAdapter implements JobSourceAdapter {
  isCompatible(url: string): boolean {
    return url.includes('naukri.com');
  }

  async extractJob(): Promise<ExtractedJobPayload | null> {
    const titleEl = document.querySelector('.styles_jds-container__... h1, .jd-header-title, h1.title');
    const title = titleEl?.textContent?.trim();
    if (!title) return null;

    const companyEl = document.querySelector('.styles_comp-name__..., .jd-header-comp-name, .company-name');
    const company = companyEl?.textContent?.trim() || 'Naukri Recruiter';

    const locationEl = document.querySelector('.styles_loc__..., .location, .loc');
    const location = locationEl?.textContent?.trim() || 'India';

    const descEl = document.querySelector('.styles_job-desc-container__..., .dang-inner-html, .job-desc');
    const descriptionText = descEl?.textContent?.trim() || '';

    const applyBtn = document.querySelector('#apply-button, button.apply-button');
    const applyBtnText = applyBtn?.textContent?.trim() || '';

    return {
      source_id: 'naukri',
      title,
      company,
      location,
      employment_type: 'Full-time',
      description_text: descriptionText,
      skills_required: [],
      application_url: window.location.href,
      raw_page_snippets: {
        apply_button_text: applyBtnText
      }
    };
  }

  observeJobChanges(onJobChange: () => void): void {
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(onJobChange, 800);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
