import re
from typing import Dict, Any, Optional
from app.services.llm_service import llm_service

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'

EXTERNAL_ATS_DOMAINS = [
    "greenhouse.io", "lever.co", "workday.com", "myworkdayjobs.com", 
    "ashbyhq.com", "icims.com", "smartrecruiters.com", "taleo.net", 
    "bamboohr.com", "jobvite.com", "recruitee.com"
]

class MethodClassifier:
    async def classify_application_method(
        self,
        description_text: str,
        raw_snippets: Dict[str, Any],
        application_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Classifies application method into:
        - WEBSITE_FORM
        - EMAIL
        - RECRUITER_MESSAGE
        - EXTERNAL_PORTAL
        - AMBIGUOUS
        """
        desc_lower = description_text.lower()
        apply_btn_text = (raw_snippets.get("apply_button_text") or "").lower()
        has_easy_apply = raw_snippets.get("has_easy_apply", False)

        # 1. Deterministic Check: Explicit Email Instructions
        # Regex search for emails in the context of application verbs
        email_phrases = ["send your resume", "email your cv", "apply at", "send application to", "reach out at", "forward resume to"]
        emails_found = re.findall(EMAIL_REGEX, description_text)

        has_email_instruction = any(phrase in desc_lower for phrase in email_phrases) and len(emails_found) > 0
        if has_email_instruction or ("email" in apply_btn_text and emails_found):
            recipient = emails_found[0]
            # Check for subject line instruction
            subj_match = re.search(r'subject(?: line)?:\s*["\']?([^"\'.\n]+)["\']?', description_text, re.IGNORECASE)
            subject_instruction = subj_match.group(1).strip() if subj_match else None

            return {
                "method": "EMAIL",
                "confidence_pct": 98,
                "explanation": f"Found explicit instructions to email application materials to {recipient}.",
                "recipient_email": recipient,
                "subject_instruction": subject_instruction,
                "external_portal_url": None,
                "recruiter_name": None,
                "recruiter_profile_url": None
            }

        # 2. Deterministic Check: External ATS Portal Link
        target_url = application_url or raw_snippets.get("redirect_url")
        if target_url:
            for domain in EXTERNAL_ATS_DOMAINS:
                if domain in target_url.lower():
                    return {
                        "method": "EXTERNAL_PORTAL",
                        "confidence_pct": 95,
                        "explanation": f"Job redirects to external ATS portal ({domain}).",
                        "recipient_email": None,
                        "subject_instruction": None,
                        "external_portal_url": target_url,
                        "recruiter_name": None,
                        "recruiter_profile_url": None
                    }

        # 3. Deterministic Check: Recruiter Messaging / InMail
        if "message recruiter" in apply_btn_text or "inmail" in apply_btn_text or "direct message" in desc_lower:
            recruiter_name = raw_snippets.get("recruiter_name")
            return {
                "method": "RECRUITER_MESSAGE",
                "confidence_pct": 90,
                "explanation": "Job listing prompts for direct recruiter message / outreach.",
                "recipient_email": None,
                "subject_instruction": None,
                "external_portal_url": None,
                "recruiter_name": recruiter_name,
                "recruiter_profile_url": raw_snippets.get("recruiter_profile_url")
            }

        # 4. Deterministic Check: Native Website Form (Easy Apply)
        if has_easy_apply or "easy apply" in apply_btn_text or "apply now" in apply_btn_text:
            return {
                "method": "WEBSITE_FORM",
                "confidence_pct": 90,
                "explanation": "Native on-page form detected (Easy Apply).",
                "recipient_email": None,
                "subject_instruction": None,
                "external_portal_url": target_url,
                "recruiter_name": None,
                "recruiter_profile_url": None
            }

        # 5. LLM Classification fallback for ambiguous text
        prompt = (
            f"Classify how the employer wants candidates to apply based on this text:\n\n"
            f"Apply Button: {apply_btn_text}\n"
            f"URL: {target_url}\n"
            f"Description Snippet: {description_text[:1200]}\n\n"
            f"Choose exactly one method from: WEBSITE_FORM, EMAIL, RECRUITER_MESSAGE, EXTERNAL_PORTAL, AMBIGUOUS.\n"
            f"Provide confidence percentage (0-100) and brief explanation."
        )
        system_prompt = (
            "You are a job application classification expert. Return JSON: "
            '{"method": "...", "confidence_pct": 85, "explanation": "..."}'
        )
        result = await llm_service.generate_json(prompt, system_prompt)

        method = result.get("method", "WEBSITE_FORM")
        confidence = result.get("confidence_pct", 75)
        explanation = result.get("explanation", "Standard job application flow detected.")

        if confidence < 70 or method not in ["WEBSITE_FORM", "EMAIL", "RECRUITER_MESSAGE", "EXTERNAL_PORTAL"]:
            method = "AMBIGUOUS"
            explanation = "Application method could not be determined with certainty. Please select your preferred method."

        return {
            "method": method,
            "confidence_pct": confidence,
            "explanation": explanation,
            "recipient_email": emails_found[0] if emails_found else None,
            "subject_instruction": None,
            "external_portal_url": target_url,
            "recruiter_name": None,
            "recruiter_profile_url": None
        }

method_classifier = MethodClassifier()
