# CV-JD Matching Scoring System

## Problem: Score Inflation

**Issue**: All CVs were getting ~85% match scores regardless of actual fit.

**Root Cause**: LLM models tend to be overly generous without strict guidelines and validation.

**Solution**: Implemented a **two-layer scoring system** with strict prompting and mathematical validation.

---

## New Scoring System

### Layer 1: Strict LLM Prompt

The prompt now includes:

1. **Clear Scoring Rubric**
   - 0-20: Poor fit (lacks most critical requirements)
   - 21-40: Weak fit (missing several important requirements)
   - 41-60: Moderate fit (meets some requirements but has gaps)
   - 61-75: Good fit (meets most requirements with minor gaps)
   - 76-85: Strong fit (meets all requirements well)
   - 86-95: Excellent fit (exceeds requirements)
   - 96-100: Perfect fit (VERY RARE - exceptional candidate)

2. **Calibration Examples**
   - Score 30: Junior applying for senior role, missing 60% skills
   - Score 45: Career switcher with transferable but no direct experience
   - Score 60: Meets 70% requirements with gaps in critical areas
   - Score 75: Solid match, meets requirements, minor skill gaps
   - Score 85: Strong candidate, all requirements met + extra experience
   - Score 95: Exceptional, exceeds all requirements (RARE)

3. **Weighted Scoring Formula**
   ```
   overall_score = (technical_skills × 0.40) +
                   (experience × 0.30) +
                   (education × 0.15) +
                   (soft_skills × 0.15)
   ```

4. **Penalty System**
   - Missing 1 critical skill: **-15 points**
   - Missing 2+ critical skills: **-30 points**
   - Experience < 50% required: **-20 points**
   - Outdated skills (>2 years): **-10 points per skill**
   - Job hopping (avg tenure < 12 months): **-15 points**
   - Education below requirement: **-10 points**
   - Critical red flag: **-20 points**

5. **Strict Instructions**
   - ❌ DO NOT be generous - most candidates are 40-60% matches
   - ❌ DO NOT give benefit of doubt - require explicit evidence
   - ❌ DO NOT inflate scores - be HARSH and REALISTIC
   - ❌ DO NOT give 80+ unless truly exceptional
   - ✅ BE STRICT on years of experience (2 years != 3+ years required)
   - ✅ REQUIRE evidence for every skill claimed
   - ✅ PENALIZE heavily for missing critical requirements
   - ✅ CONSIDER skill recency (React 2018 is outdated in 2024)

6. **Validation Rules in Prompt**
   - If missing >2 critical skills, score MUST be <60
   - If experience <50% required, score MUST be <50
   - If score >80, MUST justify why candidate is exceptional
   - Verify: overall_score = weighted_base_score - total_penalties

### Layer 2: Mathematical Validation

After the LLM provides a score, a validation layer applies strict rules:

```python
def _validate_and_adjust_score(match_data):
    """
    Enforce strict scoring rules to prevent inflation
    """
    # Calculate weighted score from components
    weighted_score = (tech×0.4 + exp×0.3 + edu×0.15 + soft×0.15)
    calculated_score = weighted_score - total_penalties

    # Apply validation rules:

    # Rule 1: Missing critical skills caps score
    if missing >=2 critical skills:
        score = min(score, 55)
    elif missing 1 critical skill:
        score = min(score, 70)

    # Rule 2: Skill match percentage enforcement
    if skill_match_pct < 50%:
        score = min(score, 45)
    elif skill_match_pct < 70%:
        score = min(score, 65)

    # Rule 3: Experience gap enforcement
    if experience < 50% required:
        score = min(score, 40)
    elif experience < 75% required:
        score = min(score, 60)

    # Rule 4: Prevent LLM inflation
    if llm_score > calculated_score + 15:
        score = calculated_score  # Use calculated, not LLM

    # Rule 5: Cap unrealistic high scores
    if score > 90 and skill_match_pct < 95%:
        score = min(score, 85)

    return score
```

---

## Score Breakdown Structure

Each CV now includes detailed scoring breakdown:

```json
{
  "evaluation_process": {
    "total_required_skills": 10,
    "skills_matched_count": 7,
    "skills_missing_count": 3,
    "critical_skills_missing": ["Kubernetes", "Docker"],
    "skill_match_percentage": 70,
    "experience_gap_years": -1,
    "penalties_applied": [
      {
        "reason": "Missing 2 critical skills",
        "points_deducted": 30
      },
      {
        "reason": "Experience 1 year below requirement",
        "points_deducted": 10
      }
    ],
    "total_penalty": 40
  },

  "score_calculation": {
    "technical_skills_score": 70,
    "experience_score": 60,
    "education_score": 80,
    "soft_skills_score": 75,
    "weighted_base_score": 68.25,  // (70×0.4 + 60×0.3 + 80×0.15 + 75×0.15)
    "total_penalties": 40,
    "final_score_before_rounding": 28,
    "overall_match_score": 28
  },

  "overall_match_score": 28,
  "score_adjusted": true,
  "original_llm_score": 65,
  "score_adjustment_reason": "Applied strict validation rules to prevent score inflation"
}
```

---

## Expected Score Distribution

With the new system, you should see realistic score distribution:

| Score Range | % of CVs | Interpretation |
|-------------|----------|----------------|
| 0-20 | 5-10% | Very poor fit, reject immediately |
| 21-40 | 15-25% | Weak fit, likely reject |
| 41-60 | 30-40% | Moderate fit, review carefully |
| 61-75 | 20-30% | Good fit, strong candidates |
| 76-85 | 5-15% | Strong fit, invite to interview |
| 86-95 | 1-5% | Excellent fit, prioritize |
| 96-100 | <1% | Perfect fit, hire quickly |

**Previous Problem**: 80% of CVs scored 80-85%
**After Fix**: Normal distribution centered around 50-60%

---

## Component Scoring

### Technical Skills (40% weight)

**Scoring:**
- **90-100**: Has all required skills + bonus skills, expert level, current experience
- **70-89**: Has most required skills, good proficiency, recent experience
- **50-69**: Has some required skills, gaps in important areas
- **30-49**: Missing multiple required skills, outdated experience
- **0-29**: Lacks most technical requirements

**Penalties:**
- Missing critical skill: -15 points per skill
- Outdated skill (>2 years): -10 points
- Weak evidence: -5 points per skill

### Experience (30% weight)

**Scoring:**
- **90-100**: Exceeds required years by 50%+, highly relevant industry
- **70-89**: Meets or exceeds required years, relevant experience
- **50-69**: 75-100% of required years, some relevant experience
- **30-49**: 50-75% of required years, limited relevance
- **0-29**: <50% of required years

**Penalties:**
- Experience < 50% required: -20 points
- Wrong industry/domain: -10 points
- Job hopping: -15 points

### Education (15% weight)

**Scoring:**
- **90-100**: Exceeds requirements, Tier-1 institution, relevant certifications
- **70-89**: Meets requirements, good institution
- **50-69**: Meets basic requirements
- **30-49**: Below requirements but acceptable
- **0-29**: Does not meet minimum education requirements

**Penalties:**
- Below required degree level: -10 points
- Irrelevant field: -5 points

### Soft Skills (15% weight)

**Scoring:**
- **90-100**: Strong evidence of leadership, communication, problem-solving
- **70-89**: Good evidence of required soft skills
- **50-69**: Some evidence, gaps in key areas
- **30-49**: Limited evidence
- **0-29**: No evidence of required soft skills

---

## Recommendation Mapping

Based on final score, the system provides clear recommendations:

| Score | Decision | Action |
|-------|----------|--------|
| 0-30 | **Strong No** | Reject, poor fit |
| 31-50 | **No** | Reject, unless exceptional circumstances |
| 51-65 | **Maybe** | Review carefully, consider gaps |
| 66-80 | **Yes** | Invite to interview, solid candidate |
| 81-90 | **Strong Yes** | Priority interview, excellent fit |
| 91-100 | **Exceptional** | Fast-track, don't lose this candidate |

---

## Logging and Transparency

The system logs all score adjustments:

```
INFO: CV abc-123 matched against JD xyz-456: 52% (LLM: 78%)
WARN: CV abc-123: Score adjusted from 78 to 52
INFO: Score adjusted from 78 to 52: Missing 2 critical skills, capping at 55; Only 60% skills matched, capping at 65
```

This ensures:
- ✅ Transparency in scoring decisions
- ✅ Ability to audit and improve system
- ✅ Understanding why scores were adjusted
- ✅ Debugging score inflation issues

---

## Benefits

### Before (Old System)
- ❌ All CVs scored 80-85%
- ❌ No differentiation between candidates
- ❌ Couldn't identify truly strong candidates
- ❌ Wasted time interviewing poor fits
- ❌ No trust in automated scoring

### After (New System)
- ✅ Realistic score distribution (30-60% average)
- ✅ Clear differentiation between candidates
- ✅ Easy to identify top 10% candidates
- ✅ Focus interviews on qualified candidates
- ✅ Trustworthy, auditable scoring
- ✅ Mathematical validation prevents inflation
- ✅ Detailed breakdown explains every score

---

## Testing the System

### Test with Sample CVs

1. **Perfect Match** (Expected: 85-95%)
   - All required skills with evidence
   - Exceeds experience requirement
   - Relevant education
   - No red flags

2. **Good Match** (Expected: 65-75%)
   - Most required skills
   - Meets experience requirement
   - Relevant education
   - Minor gaps

3. **Moderate Match** (Expected: 45-60%)
   - Some required skills
   - Below experience requirement
   - Relevant education
   - Several gaps

4. **Poor Match** (Expected: 20-40%)
   - Few required skills
   - Well below experience
   - Missing critical skills
   - Major gaps

5. **Terrible Match** (Expected: 0-20%)
   - Wrong domain entirely
   - No required skills
   - Irrelevant experience

### Verification

Check that:
1. Scores align with expectations
2. Component scores make sense
3. Penalties are applied correctly
4. Validation layer catches inflation
5. Logs show adjustment reasoning

---

## Tuning the System

If scores are still too high or low, adjust:

### Make Scoring Stricter
- Increase penalties (e.g., missing critical skill: -20 instead of -15)
- Lower validation caps (e.g., <50% skills = cap at 40 instead of 45)
- Increase component weights for critical areas

### Make Scoring More Lenient
- Decrease penalties
- Raise validation caps
- Give more credit for transferable skills

### Adjust Weights
Current: Technical (40%), Experience (30%), Education (15%), Soft Skills (15%)

For technical roles: Increase technical to 50%, reduce others
For leadership roles: Increase soft skills to 25%, reduce technical

---

## Monitoring

Track these metrics:

1. **Score Distribution**
   - Average score across all CVs
   - Median score
   - Standard deviation
   - Percentage in each bucket (0-20, 21-40, etc.)

2. **Validation Adjustments**
   - How often scores are adjusted
   - Average adjustment magnitude
   - Most common adjustment reasons

3. **Interview Outcomes**
   - Do high-scoring CVs perform well in interviews?
   - Are low-scoring CVs correctly filtered?
   - Correlation between score and hire rate

4. **Business Metrics**
   - Time saved by filtering poor fits
   - Interview-to-hire conversion rate
   - Quality of hires

---

## FAQ

**Q: Why are my scores lower now?**
A: The old system was inflated. The new system is realistic. A score of 60% is now actually good!

**Q: Can I trust these scores?**
A: Yes! The system uses:
- Evidence-based evaluation
- Mathematical validation
- Transparent scoring breakdown
- Logged adjustments

**Q: What if a good candidate scores low?**
A: Review the detailed breakdown. Look at:
- What skills are missing?
- Are they critical or nice-to-have?
- Can they be learned?
- Is there transferable experience?

**Q: How do I compare candidates?**
A: Use both the overall score and component breakdowns:
- Technical skills for tech roles
- Experience for senior positions
- Growth potential for junior roles

**Q: Can I adjust the scoring formula?**
A: Yes! Edit `cv_jd_matcher.py`:
- Change weights in weighted formula
- Adjust penalties
- Modify validation caps
- Add custom rules

---

**Last Updated**: 2025-12-06
**Version**: 2.0 (Strict Scoring with Validation)
