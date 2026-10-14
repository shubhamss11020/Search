import io
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from app.services.llm_service import llm_service

class ResumeParser:
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """
        Extract raw text content from PDF bytes using pypdf.
        """
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            return "\n".join(text_parts).strip()
        except Exception as e:
            return f"Error extracting PDF: {str(e)}"

    async def parse_resume_to_profile(self, resume_text: str) -> Dict[str, Any]:
        """
        Uses LLM (Gemini / Grok) to convert raw text into verified candidate profile schema.
        Adheres strictly to zero-hallucination principle: extracts only what is present.
        """
        system_prompt = (
            "You are an expert resume parsing engine. Extract truthful, factual candidate information "
            "from the provided resume text. NEVER invent skills, employment dates, or qualifications. "
            "Return valid JSON matching this schema:\n"
            "{\n"
            '  "headline": "string",\n'
            '  "phone": "string or null",\n'
            '  "location": "string or null",\n'
            '  "skills": [{"name": "string", "category": "backend|frontend|cloud|data|other", "level": "intermediate|senior"}],\n'
            '  "experience": [{"title": "string", "company": "string", "start_date": "string", "end_date": "string", "highlights": ["string"]}],\n'
            '  "education": [{"institution": "string", "degree": "string", "graduation_year": "string"}],\n'
            '  "projects": [{"name": "string", "description": "string", "tech_stack": ["string"]}],\n'
            '  "links": {"github": "string", "linkedin": "string", "portfolio": "string"},\n'
            '  "verified_facts": {"work_authorization": "string or unknown", "notice_period": "string or unknown"}\n'
            "}"
        )

        prompt = f"Resume Content:\n\n{resume_text[:6000]}"
        parsed = await llm_service.generate_json(prompt, system_prompt)

        # Fallback heuristic if LLM produced error or empty result
        if not parsed or "error" in parsed:
            parsed = self._heuristic_parse(resume_text)

        return parsed

    def _heuristic_parse(self, text: str) -> Dict[str, Any]:
        """
        Regex/Heuristic fallback for basic fields.
        """
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0) if phone_match else None
        
        # Simple common tech skills search
        common_skills = ["Python", "JavaScript", "TypeScript", "React", "Node.js", "Docker", "PostgreSQL", "AWS", "FastAPI", "SQL", "Git"]
        found_skills = [{"name": s, "category": "tech", "level": "intermediate"} for s in common_skills if re.search(rf"\b{re.escape(s)}\b", text, re.IGNORECASE)]

        return {
            "headline": "Software Engineer",
            "phone": phone,
            "location": None,
            "skills": found_skills,
            "experience": [],
            "education": [],
            "projects": [],
            "links": {},
            "verified_facts": {}
        }

resume_parser = ResumeParser()
