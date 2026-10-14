import { JobSourceAdapter } from './base_adapter';
import { ExtractedJobPayload } from '../../shared/types';

export class GenericAdapter implements JobSourceAdapter {
  isCompatible(_url: string): boolean {
    return true; // Fallback adapter for any page
  }

  async extractJob(): Promise<ExtractedJobPayload | null> {
    // 1. Try finding Schema.org JobPosting microdata
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || '{}');
        const posting = data['@type'] === 'JobPosting' ? data : (Array.isArray(data['@graph']) ? data['@graph'].find((item: any) => item['@type'] === 'JobPosting') : null);
        if (posting) {
          return {
            source_id: 'generic',
            title: posting.title,
            company: posting.hiringOrganization?.name || document.title,
            location: posting.jobLocation?.address?.addressLocality || 'Not specified',
            description_text: posting.description ? this.stripHtml(posting.description) : '',
            skills_required: [],
            application_url: window.location.href,
            source_posted_at: posting.datePosted,
            raw_page_snippets: {}
          };
        }
      } catch (_) {}
    }

    // 2. Generic heuristics (H1 for title, meta tags)
    const h1 = document.querySelector('h1');
    if (!h1 || h1.textContent!.trim().length < 4) return null;

    const title = h1.textContent!.trim();
    const description = document.body.innerText.slice(0, 4000);

    return {
      source_id: 'generic',
      title,
      company: document.title.split('-')[0]?.trim() || 'Company',
      description_text: description,
      skills_required: [],
      application_url: window.location.href,
      raw_page_snippets: {}
    };
  }

  observeJobChanges(_onJobChange: () => void): void {}

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
