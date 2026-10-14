import { getSettings } from './storage';
import { 
  CandidateProfile, 
  Job, 
  ExtractedJobPayload, 
  WorkflowDraftResult, 
  Application,
  ResumeFile
} from './types';

export class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const settings = await getSettings();
    const url = `${settings.apiBaseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (settings.token) {
      headers['Authorization'] = `Bearer ${settings.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired
      console.warn('Session expired. Please log in.');
    }

    if (!response.ok) {
      let errorMsg = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(email: string, password: string, full_name: string): Promise<{ access_token: string; user: any }> {
    return this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name })
    });
  }

  async getMe(): Promise<any> {
    return this.request<any>('/auth/me');
  }

  // Candidate Profile
  async getProfile(): Promise<CandidateProfile> {
    return this.request<CandidateProfile>('/profile');
  }

  async updateProfile(profile: Partial<CandidateProfile>): Promise<CandidateProfile> {
    return this.request<CandidateProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  }

  async deleteProfile(): Promise<void> {
    const settings = await getSettings();
    await fetch(`${settings.apiBaseUrl}/profile`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${settings.token}` }
    });
  }

  // Resumes
  async listResumes(): Promise<ResumeFile[]> {
    return this.request<ResumeFile[]>('/resumes');
  }

  async uploadResume(formData: FormData): Promise<any> {
    const settings = await getSettings();
    const response = await fetch(`${settings.apiBaseUrl}/resumes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.token}`
      },
      body: formData
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload resume');
    }
    return response.json();
  }

  // Jobs
  async ingestJob(jobData: ExtractedJobPayload): Promise<any> {
    return this.request<any>('/jobs/ingest', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
  }

  async getJobs(params: {
    recency_window?: string;
    min_match_score?: number;
    source_id?: string;
    is_saved?: boolean;
    sort_by?: string;
    search?: string;
  } = {}): Promise<Job[]> {
    const searchParams = new URLSearchParams();
    if (params.recency_window) searchParams.set('recency_window', params.recency_window);
    if (params.min_match_score !== undefined) searchParams.set('min_match_score', params.min_match_score.toString());
    if (params.source_id) searchParams.set('source_id', params.source_id);
    if (params.is_saved !== undefined) searchParams.set('is_saved', params.is_saved.toString());
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params.search) searchParams.set('search', params.search);

    return this.request<Job[]>(`/jobs?${searchParams.toString()}`);
  }

  async toggleSaveJob(jobId: string): Promise<{ id: string; is_saved: boolean }> {
    return this.request<{ id: string; is_saved: boolean }>(`/jobs/${jobId}/save`, { method: 'PUT' });
  }

  async dismissJob(jobId: string): Promise<{ id: string; is_dismissed: boolean }> {
    return this.request<{ id: string; is_dismissed: boolean }>(`/jobs/${jobId}/dismiss`, { method: 'PUT' });
  }

  // Workflows
  async draftWorkflow(jobId: string, workflowType?: string, questionsToAnswer?: any[]): Promise<WorkflowDraftResult> {
    return this.request<WorkflowDraftResult>('/workflows/draft', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        workflow_type: workflowType,
        questions_to_answer: questionsToAnswer || []
      })
    });
  }

  // Applications
  async listApplications(statusFilter?: string): Promise<Application[]> {
    const query = statusFilter ? `?status_filter=${statusFilter}` : '';
    return this.request<Application[]>(`/applications${query}`);
  }

  async updateApplicationStatus(applicationId: string, status: string, notes?: string): Promise<Application> {
    return this.request<Application>(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  }

  getExportCsvUrl(): string {
    return '/applications/export/csv';
  }
}

export const apiClient = new ApiClient();
