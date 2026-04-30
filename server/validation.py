def validate_hybrid_sections(llm_sections, rule_based_sections):
    """
    Ensures the LLM does not hallucinate sections that weren't found by the rule-based engine.
    If the rule-based engine found nothing for a section (length < 10), we force it to be empty.
    """
    validated_sections = {}
    for section in ["summary", "skills", "experience", "education", "projects", "achievements"]:
        has_rule_based = len(rule_based_sections.get(section, "")) > 10
        
        # If the rule-based engine didn't find it, the LLM hallucinated it.
        if not has_rule_based:
            validated_sections[section] = ""
        else:
            # Use the LLM's section if it exists, otherwise fallback to the raw text
            llm_text = llm_sections.get(section, "") if isinstance(llm_sections, dict) else ""
            if len(llm_text) > 10:
                validated_sections[section] = llm_text
            else:
                validated_sections[section] = rule_based_sections.get(section, "")
                
    return validated_sections

def enforce_type_list(val):
    if isinstance(val, list):
        return [str(x) for x in val]
    return []

def enforce_score_range(val, default=0):
    try:
        score = float(val)
        return max(0, min(100, score))
    except (ValueError, TypeError):
        return default

def validate_analyze_output(data, heuristics):
    # Safe base dictionary
    result = {
        "match_score": 0,
        "matched_skills": [],
        "missing_skills": [],
        "ats_score": 0,
        "keyword_match_score": 0,
        "format_score": enforce_score_range(heuristics.get("format_score", 0)),
        "section_score": enforce_score_range(heuristics.get("section_score", 0)),
        "keywords": [],
        "top_skills": [],
        "tools": [],
        "sections": {
            "skills": "",
            "experience": "",
            "education": "",
            "projects": ""
        }
    }

    if not isinstance(data, dict):
        # Even if data is bad, we still use heuristic scores
        result["ats_score"] = round((result["format_score"] * 0.1) + (result["section_score"] * 0.1))
        return result

    result["match_score"] = enforce_score_range(data.get("match_score", 0))
    result["keyword_match_score"] = enforce_score_range(data.get("keyword_match_score", 0))

    if "format_score" in data:
        result["format_score"] = enforce_score_range(data["format_score"])
    if "section_score" in data:
        result["section_score"] = enforce_score_range(data["section_score"])

    # Compute final ATS Score
    result["ats_score"] = round((result["keyword_match_score"] * 0.4) + 
                                (result["match_score"] * 0.4) + 
                                (result["format_score"] * 0.1) + 
                                (result["section_score"] * 0.1))

    # Safely extract lists
    for key in ["matched_skills", "missing_skills", "keywords", "top_skills", "tools"]:
        result[key] = enforce_type_list(data.get(key, []))

    # Validate sections strictly
    llm_sections = data.get("sections", {})
    result["sections"] = validate_hybrid_sections(llm_sections, heuristics.get("sections", {}))

    return result

def validate_advanced_output(data, heuristics):
    # Calculate some heuristic-based scores since we didn't ask LLM for them to save time
    format_score = enforce_score_range(heuristics.get("format_score", 0))
    section_score = enforce_score_range(heuristics.get("section_score", 0))
    
    # Fake match score since LLM doesn't calculate it in advanced mode
    match_score = 75 
    keyword_match_score = 70
    
    ats_score = round((keyword_match_score * 0.4) + (match_score * 0.4) + (format_score * 0.1) + (section_score * 0.1))
    
    # Base response
    result = {
        "ats_score": ats_score,
        "match_score": match_score,
        "keyword_match_score": keyword_match_score,
        "format_score": format_score,
        "section_score": section_score,
        "sections": validate_hybrid_sections({}, heuristics.get("sections", {})),
        "score_breakdown": {
            "skills": format_score, 
            "experience": section_score,
            "projects": 50,
            "education": 50
        },
        "skill_distribution": [],
        "matched_skills": [],
        "missing_skills": [],
        "recommended_skills": [],
        "improved_points": [],
        "rewritten_resume": "Processing failed. The local LLM could not rewrite the resume within the time limit or provided invalid JSON.",
        "keywords": [],
        "top_skills": [],
        "tools": []
    }

    if not isinstance(data, dict):
        return result
        
    # Extract Score Breakdown
    if "score_breakdown" in data and isinstance(data["score_breakdown"], dict):
        for k in ["skills", "experience", "projects", "education"]:
            if k in data["score_breakdown"]:
                result["score_breakdown"][k] = enforce_score_range(data["score_breakdown"][k], default=50)
            
    # Extract basic lists
    for key in ["matched_skills", "missing_skills", "recommended_skills"]:
        result[key] = enforce_type_list(data.get(key, []))
            
    # Extract skill distribution
    dist = data.get("skill_distribution", [])
    if isinstance(dist, list):
        for item in dist:
            if isinstance(item, dict) and "skill" in item and "level" in item:
                result["skill_distribution"].append({
                    "skill": str(item["skill"]),
                    "level": str(item["level"])
                })
                
    # Extract improved points
    pts = data.get("improved_points", [])
    if isinstance(pts, list):
        for pt in pts:
            if isinstance(pt, dict) and "original" in pt and "improved" in pt:
                result["improved_points"].append({
                    "original": str(pt["original"]),
                    "improved": str(pt["improved"])
                })
                
    # Extract rewritten resume as structured JSON
    if "rewritten_resume" in data and isinstance(data["rewritten_resume"], dict):
        rr = data["rewritten_resume"]
        struct = {
            "summary": str(rr.get("summary", "")),
            "skills": enforce_type_list(rr.get("skills", [])),
            "experience": [],
            "projects": [],
            "education": [],
            "achievements": enforce_type_list(rr.get("achievements", []))
        }
        
        # Enforce Experience
        exp = rr.get("experience", [])
        if isinstance(exp, list):
            for e in exp:
                if isinstance(e, dict):
                    struct["experience"].append({
                        "role": str(e.get("role", "")),
                        "company": str(e.get("company", "")),
                        "duration": str(e.get("duration", "")),
                        "points": enforce_type_list(e.get("points", []))
                    })
                    
        # Enforce Projects
        proj = rr.get("projects", [])
        if isinstance(proj, list):
            for p in proj:
                if isinstance(p, dict):
                    struct["projects"].append({
                        "name": str(p.get("name", "")),
                        "description": str(p.get("description", ""))
                    })
                    
        # Enforce Education
        edu = rr.get("education", [])
        if isinstance(edu, list):
            for ed in edu:
                if isinstance(ed, dict):
                    struct["education"].append({
                        "degree": str(ed.get("degree", "")),
                        "institution": str(ed.get("institution", "")),
                        "year": str(ed.get("year", ""))
                    })
                    
        result["rewritten_resume"] = struct
    else:
        # Fallback empty structure
        result["rewritten_resume"] = {
            "summary": "Processing failed. The local LLM could not rewrite the resume within the time limit.",
            "skills": [],
            "experience": [],
            "projects": [],
            "education": [],
            "achievements": []
        }
            
    return result
