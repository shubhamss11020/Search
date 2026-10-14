import re
from typing import Dict, Any, List, Tuple
from app.models.profile import CandidateProfile
from app.models.job import Job

class MatchingEngine:
    def calculate_match(self, profile: CandidateProfile, job_title: str, job_description: str, job_skills: List[str]) -> Dict[str, Any]:
        """
        Calculates match score (0-100), checks mandatory requirements,
        identifies matched and missing skills, and generates an honest explanation.
        """
        # Normalize profile skills
        candidate_skills = set()
        if profile and profile.skills:
            for s in profile.skills:
                if isinstance(s, dict) and "name" in s:
                    candidate_skills.add(s["name"].lower().strip())
                elif isinstance(s, str):
                    candidate_skills.add(s.lower().strip())

        # Extract skills mentioned in job
        target_skills = set(s.lower().strip() for s in job_skills if s)
        
        # If no explicit skills list provided, extract from description
        desc_lower = job_description.lower()
        title_lower = job_title.lower()

        # Skill matching
        matched = []
        missing_mandatory = []
        missing_preferred = []

        if target_skills:
            for skill in target_skills:
                # check exact or word boundary match
                if skill in candidate_skills or any(skill in cs or cs in skill for cs in candidate_skills):
                    matched.append(skill.title())
                else:
                    # heuristic: if in title or explicitly marked required
                    if skill in title_lower or f"required: {skill}" in desc_lower or f"must have {skill}" in desc_lower:
                        missing_mandatory.append(skill.title())
                    else:
                        missing_preferred.append(skill.title())
        else:
            # Fallback: scan candidate skills in job description
            for cs in candidate_skills:
                if re.search(rf"\b{re.escape(cs)}\b", desc_lower):
                    matched.append(cs.title())

        # Title alignment check
        title_match = False
        if profile and profile.preferred_roles:
            for role in profile.preferred_roles:
                role_words = [w for w in role.lower().split() if len(w) > 3]
                if any(w in title_lower for w in role_words):
                    title_match = True
                    break

        # Compute match score (0 to 100)
        total_eval = len(matched) + len(missing_mandatory) + len(missing_preferred)
        if total_eval > 0:
            skill_ratio = len(matched) / total_eval
            base_score = int(skill_ratio * 70) # skills up to 70 pts
        else:
            base_score = 50 # neutral baseline if no skills specified

        if title_match:
            base_score += 20 # role alignment bonus
        else:
            base_score += 5

        # Check location / work arrangement fit
        warnings = []
        if profile and profile.work_arrangements:
            # If user prefers remote only, check if job is onsite
            if "remote" in [w.lower() for w in profile.work_arrangements] and "onsite" in desc_lower and "remote" not in desc_lower:
                warnings.append("Job appears to require on-site presence, but your profile prefers Remote.")
                base_score -= 15

        # Eligibility flag
        is_eligible = len(missing_mandatory) == 0
        if not is_eligible:
            warnings.append(f"Missing mandatory requirements: {', '.join(missing_mandatory)}")

        # Final score clamping
        final_score = max(5, min(99, base_score))

        # Generate human-readable explanation
        explanation_parts = []
        if matched:
            explanation_parts.append(f"Strong overlap with your skills in {', '.join(matched[:5])}.")
        if title_match:
            explanation_parts.append("Directly matches your target job title preferences.")
        if missing_mandatory:
            explanation_parts.append(f"Requires key skills not currently in your profile: {', '.join(missing_mandatory)}.")
        elif missing_preferred:
            explanation_parts.append(f"Optional qualifications missing: {', '.join(missing_preferred[:3])}.")

        if not explanation_parts:
            explanation_parts.append("General match based on software engineering qualifications.")

        summary_explanation = " ".join(explanation_parts)

        return {
            "match_score": final_score,
            "is_eligible": is_eligible,
            "summary_explanation": summary_explanation,
            "matched_skills": matched,
            "missing_mandatory_skills": missing_mandatory,
            "missing_preferred_skills": missing_preferred,
            "eligibility_warnings": warnings
        }

matching_engine = MatchingEngine()
