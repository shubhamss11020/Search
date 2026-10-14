import json
from typing import Dict, Any, List, Optional
from app.models.profile import CandidateProfile
from app.services.llm_service import llm_service

class AIGenerator:
    async def generate_form_answers(
        self,
        questions: List[Dict[str, Any]],
        profile: CandidateProfile,
        job_title: str,
        company: str,
        description: str
    ) -> List[Dict[str, Any]]:
        """
        Drafts answers for form questions grounded strictly in verified profile facts.
        """
        verified_summary = self._summarize_profile_facts(profile)
        
        results = []
        for q in questions:
            field_id = q.get("field_id", "")
            question_text = q.get("question", "")
            max_chars = q.get("max_chars")

            system_instruction = (
                "You are an application assistant drafting concise, honest answers for job application forms. "
                "CRITICAL REQUIREMENT: AI must NEVER invent work experience, qualifications, employment dates, or technical skills. "
                "You must strictly ground your response in the verified candidate facts. If information is not in the facts, "
                "politely state that or provide the closest truthful information."
            )

            prompt = (
                f"Candidate Verified Facts:\n{verified_summary}\n\n"
                f"Job Title: {job_title}\nCompany: {company}\n"
                f"Question: {question_text}\n"
                f"Character limit: {max_chars or 'None'}\n\n"
                f"Draft an answer that is professional, tailored, truthful, and strictly within character limits."
            )

            answer = await llm_service.generate_text(prompt, system_instruction)
            answer = answer.strip(' "')

            if max_chars and len(answer) > max_chars:
                answer = answer[:max_chars].rsplit(' ', 1)[0] + "."

            results.append({
                "field_id": field_id,
                "question": question_text,
                "answer": answer,
                "grounded_facts": [k for k in (profile.verified_facts or {}).keys()]
            })

        return results

    async def generate_email_application(
        self,
        profile: CandidateProfile,
        job_title: str,
        company: str,
        recipient_email: str,
        subject_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Drafts a tailored email application and subject line for manual user review.
        """
        subject = subject_instruction or f"Job Application: {job_title} - {profile.user.full_name if profile and profile.user else 'Candidate'}"
        
        verified_summary = self._summarize_profile_facts(profile)

        system_instruction = (
            "You are a professional career assistant drafting a concise, persuasive email application. "
            "Never invent qualifications. Keep the tone courteous, confident, and professional."
        )

        prompt = (
            f"Candidate Facts:\n{verified_summary}\n\n"
            f"Target Company: {company}\nTarget Role: {job_title}\n\n"
            f"Write a 3-paragraph email application cover note for the candidate to review before sending. "
            f"Do not include placeholders like '[Insert Date]'. Ground all claims in the provided candidate facts."
        )

        body = await llm_service.generate_text(prompt, system_instruction)

        return {
            "to": recipient_email,
            "subject": subject,
            "body": body.strip(),
            "notes": "Review and verify email body before copying or sending via your email client."
        }

    async def generate_recruiter_message(
        self,
        profile: CandidateProfile,
        job_title: str,
        company: str,
        recruiter_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Drafts a concise LinkedIn InMail / direct connection note under 300 characters.
        """
        greeting = f"Hi {recruiter_name}," if recruiter_name else "Hello,"
        skills_summary = ", ".join([s["name"] for s in (profile.skills or [])[:3] if isinstance(s, dict)])
        
        prompt = (
            f"Write a high-impact LinkedIn outreach note from a candidate to a recruiter. "
            f"Candidate top skills: {skills_summary}. Target role: {job_title} at {company}. "
            f"Maximum length: 280 characters strictly. Professional and courteous."
        )

        draft = await llm_service.generate_text(prompt)
        draft = draft.strip(' "')
        if len(draft) > 295:
            draft = draft[:290].rsplit(' ', 1)[0] + "."

        return {
            "message": draft,
            "char_count": len(draft)
        }

    def _summarize_profile_facts(self, profile: CandidateProfile) -> str:
        if not profile:
            return "No profile facts provided."
        
        skills_str = ", ".join([s.get("name", "") if isinstance(s, dict) else str(s) for s in (profile.skills or [])])
        exp_list = []
        for exp in (profile.experience or []):
            if isinstance(exp, dict):
                exp_list.append(f"{exp.get('title')} at {exp.get('company')} ({exp.get('start_date')}-{exp.get('end_date')})")
        
        facts = [
            f"Headline: {profile.headline or 'Software Engineer'}",
            f"Skills: {skills_str}",
            f"Experience: {'; '.join(exp_list)}",
            f"Verified QA facts: {json.dumps(profile.verified_facts or {})}"
        ]
        return "\n".join(facts)

ai_generator = AIGenerator()
