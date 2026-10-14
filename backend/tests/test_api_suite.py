import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_end_to_end_workflow():
    import uuid
    # 1. Register User
    unique_suffix = uuid.uuid4().hex[:8]
    user_email = f"alex_{unique_suffix}@example.com"
    user_password = "SecurePassword123!"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": user_email,
        "password": user_password,
        "full_name": "Alex Candidate"
    })
    assert reg_resp.status_code == 201
    auth_data = reg_resp.json()
    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update Profile with verified skills and facts
    prof_resp = client.put("/api/v1/profile", headers=headers, json={
        "headline": "Senior Python Backend Engineer",
        "phone": "+1-555-0199",
        "skills": [
            {"name": "Python", "category": "backend", "level": "expert"},
            {"name": "FastAPI", "category": "backend", "level": "expert"},
            {"name": "PostgreSQL", "category": "database", "level": "senior"},
            {"name": "Docker", "category": "devops", "level": "intermediate"}
        ],
        "preferred_roles": ["Senior Backend Engineer", "Python Developer"],
        "work_arrangements": ["remote"],
        "verified_facts": {
            "work_authorization": "Authorized to work in US without sponsorship",
            "notice_period_days": 30
        }
    })
    assert prof_resp.status_code == 200
    assert prof_resp.json()["headline"] == "Senior Python Backend Engineer"

    # 3. Ingest Job 1: Email application instructions
    email_job_resp = client.post("/api/v1/jobs/ingest", headers=headers, json={
        "source_id": "linkedin",
        "title": "Senior Python Backend Engineer",
        "company": "Acme Cloud Corp",
        "location": "Remote",
        "description_text": "We are seeking a Senior Python Backend Engineer with FastAPI and PostgreSQL. To apply, please email your resume to hiring@acmecloud.com with subject: Senior Python Engineer Application.",
        "skills_required": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "application_url": "https://linkedin.com/jobs/view/123456",
        "raw_page_snippets": {
            "apply_button_text": "Apply via email"
        }
    })
    assert email_job_resp.status_code == 201
    email_job_data = email_job_resp.json()
    assert email_job_data["match"]["match_score"] >= 80
    assert email_job_data["workflow"]["method"] == "EMAIL"
    assert email_job_data["workflow"]["recipient_email"] == "hiring@acmecloud.com"
    email_job_id = email_job_data["job"]["id"]

    # 4. Ingest Job 2: Easy Apply / Website Form
    form_job_resp = client.post("/api/v1/jobs/ingest", headers=headers, json={
        "source_id": "linkedin",
        "title": "Full Stack Developer",
        "company": "Beta Tech",
        "location": "Remote",
        "description_text": "Looking for a full stack engineer with Python and React.",
        "skills_required": ["Python", "React", "Rust"],
        "application_url": "https://linkedin.com/jobs/view/789012",
        "raw_page_snippets": {
            "apply_button_text": "Easy Apply",
            "has_easy_apply": True
        }
    })
    assert form_job_resp.status_code == 201
    form_job_data = form_job_resp.json()
    assert form_job_data["workflow"]["method"] == "WEBSITE_FORM"
    form_job_id = form_job_data["job"]["id"]

    # 5. Filter Jobs by recency
    list_resp = client.get("/api/v1/jobs?recency_window=24h&sort_by=best_match", headers=headers)
    assert list_resp.status_code == 200
    jobs = list_resp.json()
    assert len(jobs) >= 2

    # 6. Draft Email Workflow
    email_draft_resp = client.post("/api/v1/workflows/draft", headers=headers, json={
        "job_id": email_job_id
    })
    assert email_draft_resp.status_code == 200
    draft_data = email_draft_resp.json()
    assert draft_data["workflow_type"] == "EMAIL"
    assert draft_data["email_draft"]["to"] == "hiring@acmecloud.com"

    # 7. Draft Form Workflow with grounded answers
    form_draft_resp = client.post("/api/v1/workflows/draft", headers=headers, json={
        "job_id": form_job_id,
        "questions_to_answer": [
            {"field_id": "why_us", "question": "Why do you want to join Beta Tech?", "max_chars": 400}
        ]
    })
    assert form_draft_resp.status_code == 200
    form_draft_data = form_draft_resp.json()
    assert form_draft_data["workflow_type"] == "WEBSITE_FORM"
    assert len(form_draft_data["form_qa_answers"]) == 1

    # 8. User manually confirms submission -> transition to APPLIED
    status_update_resp = client.put(f"/api/v1/applications/{draft_data['application_id']}/status", headers=headers, json={
        "status": "APPLIED",
        "notes": "Sent personalized email with resume attached from personal Gmail."
    })
    assert status_update_resp.status_code == 200
    assert status_update_resp.json()["status"] == "APPLIED"

    # 9. Export Applications CSV
    csv_resp = client.get("/api/v1/applications/export/csv", headers=headers)
    assert csv_resp.status_code == 200
    assert "Job Title,Company" in csv_resp.text
    assert "Acme Cloud Corp" in csv_resp.text

    # 10. GDPR Deletion Compliance
    del_resp = client.delete("/api/v1/profile", headers=headers)
    assert del_resp.status_code == 204
