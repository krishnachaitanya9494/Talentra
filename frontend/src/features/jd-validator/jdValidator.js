/**
 * DETERMINISTIC JOB DESCRIPTION QUALITY & COMPLETENESS VALIDATOR
 * 
 * 100% rule-based validation engine.
 * Categorizes findings into Critical, Warning, and Suggestion tiers.
 * Zero external AI / LLM dependencies.
 */

export function validateJobDescription(jd, sections = null) {
  const issues = [];
  let score = 100;

  const title = (jd?.title || '').trim();
  const description = (jd?.description || '').trim();
  const skills = (jd?.skills || jd?.required_skills || '').trim();
  const location = (jd?.location || '').trim();
  const expMin = jd?.min_experience_years != null ? Number(jd.min_experience_years) : null;
  const expMax = jd?.max_experience_years != null ? Number(jd.max_experience_years) : null;

  // 1. CRITICAL CHECKS (-25 points each)
  if (!title) {
    issues.push({
      type: 'critical',
      field: 'title',
      message: 'Job Title is missing. Requisition cannot be identified.',
      resolution: 'Enter an official job title (e.g. Lead Cloud Architect).'
    });
    score -= 25;
  }

  if (!description || description.length < 30) {
    issues.push({
      type: 'critical',
      field: 'description',
      message: 'Job description is empty or too short (< 30 characters).',
      resolution: 'Provide a complete summary of role expectations.'
    });
    score -= 25;
  }

  if (!skills) {
    issues.push({
      type: 'critical',
      field: 'skills',
      message: 'No technical skills specified.',
      resolution: 'Add at least 2 mandatory technical skills.'
    });
    score -= 25;
  }

  // 2. WARNING CHECKS (-10 points each)
  if (expMin != null && expMax != null && expMin > expMax) {
    issues.push({
      type: 'warning',
      field: 'experience',
      message: `Inconsistent experience range: minimum (${expMin} yrs) exceeds maximum (${expMax} yrs).`,
      resolution: 'Adjust minimum experience to be lower than or equal to maximum.'
    });
    score -= 10;
  }

  if (!location) {
    issues.push({
      type: 'warning',
      field: 'location',
      message: 'Work location or remote policy is unspecified.',
      resolution: 'Specify city, state or specify "Remote" / "Hybrid".'
    });
    score -= 10;
  }

  // Check for duplicate skills
  if (skills) {
    const rawList = skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const seen = new Set();
    const duplicates = [];
    for (const item of rawList) {
      if (seen.has(item) && !duplicates.includes(item)) {
        duplicates.push(item);
      }
      seen.add(item);
    }
    if (duplicates.length > 0) {
      issues.push({
        type: 'warning',
        field: 'skills',
        message: `Duplicate skills detected: ${duplicates.join(', ')}.`,
        resolution: 'Remove duplicate skill entries to maintain clean taxonomy.'
      });
      score -= 5;
    }
  }

  // 3. SUGGESTIONS (-5 points each)
  if (sections) {
    if (!sections.education || sections.education.length === 0) {
      issues.push({
        type: 'suggestion',
        field: 'education',
        message: 'No educational qualification specified.',
        resolution: 'Add preferred degree (e.g. B.Tech / B.E. in Computer Science).'
      });
      score -= 5;
    }
    if (!sections.certifications || sections.certifications.length === 0) {
      issues.push({
        type: 'suggestion',
        field: 'certifications',
        message: 'No industry certifications listed.',
        resolution: 'Specify preferred vendor credentials (e.g. AWS Certified Solutions Architect).'
      });
      score -= 5;
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const criticalCount = issues.filter((i) => i.type === 'critical').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;
  const suggestionCount = issues.filter((i) => i.type === 'suggestion').length;

  return {
    completeness_percentage: finalScore,
    is_publishable: criticalCount === 0 && finalScore >= 60,
    critical_count: criticalCount,
    warning_count: warningCount,
    suggestion_count: suggestionCount,
    issues,
  };
}
