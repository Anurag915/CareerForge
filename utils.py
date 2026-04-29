import pdfplumber
import json
import re

def extract_text(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def chunk_text(text, chunk_size=500):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def clean_output(text):
    if not text:
        return {"error": "Empty response"}
    
    try:
        # Try to parse directly first
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            # Look for JSON block
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end != -1:
                json_str = text[start:end]
                return json.loads(json_str)
            return {"error": "No JSON found", "raw": text}
        except:
            return {"error": "Invalid JSON", "raw": text}

def extract_sections(text):
    """Rule-based heuristic to detect sections in raw text."""
    sections = {
        "skills": "",
        "experience": "",
        "education": "",
        "projects": ""
    }
    
    lower_text = text.lower()
    
    keywords = {
        "skills": ["skills", "technical skills", "core competencies", "technologies"],
        "experience": ["experience", "work experience", "professional experience", "employment"],
        "education": ["education", "academic background", "qualifications"],
        "projects": ["projects", "personal projects", "academic projects"]
    }
    
    positions = []
    for section, words in keywords.items():
        best_pos = -1
        for word in words:
            # Look for word preceded by newline and followed by newline or colon
            match = re.search(r'(?:\n|^)\s*' + re.escape(word) + r'\s*(?:\n|:)', lower_text)
            if match:
                best_pos = match.start()
                break
        if best_pos != -1:
            positions.append((best_pos, section))
            
    positions.sort()
    
    for i in range(len(positions)):
        start_idx = positions[i][0]
        section_name = positions[i][1]
        
        if i + 1 < len(positions):
            end_idx = positions[i+1][0]
            sections[section_name] = text[start_idx:end_idx].strip()
        else:
            sections[section_name] = text[start_idx:].strip()
            
    return sections

def calculate_heuristic_scores(text, sections):
    """Calculates format and section completeness scores."""
    # Section score
    sections_found = sum(1 for v in sections.values() if len(v) > 20)
    section_score = (sections_found / 4) * 100
    
    # Format score
    format_score = 100
    if len(text) < 500: format_score -= 30
    if len(text) > 8000: format_score -= 20
    if text.count('\n') < 10: format_score -= 20
        
    return {
        "section_score": max(0, min(100, round(section_score))),
        "format_score": max(0, min(100, format_score))
    }

def validate_analyze_output(data, heuristics):
    result = {
        "match_score": 0,
        "matched_skills": [],
        "missing_skills": [],
        "ats_score": 0,
        "keyword_match_score": 0,
        "format_score": heuristics.get("format_score", 0),
        "section_score": heuristics.get("section_score", 0),
        "keywords": [],
        "top_skills": [],
        "tools": [],
        "sections": heuristics.get("sections", {
            "skills": "",
            "experience": "",
            "education": "",
            "projects": ""
        })
    }

    if not isinstance(data, dict):
        return result

    try: result["match_score"] = float(data.get("match_score", 0))
    except: pass
    
    try: result["keyword_match_score"] = float(data.get("keyword_match_score", 0))
    except: pass

    try:
        if "format_score" in data and isinstance(data["format_score"], (int, float)):
            result["format_score"] = float(data["format_score"])
    except: pass

    try:
        if "section_score" in data and isinstance(data["section_score"], (int, float)):
            result["section_score"] = float(data["section_score"])
    except: pass

    # Compute final ATS Score
    result["ats_score"] = round((result["keyword_match_score"] * 0.4) + 
                                (result["match_score"] * 0.4) + 
                                (result["format_score"] * 0.1) + 
                                (result["section_score"] * 0.1))

    for key in ["matched_skills", "missing_skills", "keywords", "top_skills", "tools"]:
        val = data.get(key, [])
        if isinstance(val, list):
            result[key] = [str(x) for x in val]

    llm_sections = data.get("sections", {})
    if isinstance(llm_sections, dict):
        for k in ["skills", "experience", "education", "projects"]:
            if k in llm_sections and isinstance(llm_sections[k], str) and len(llm_sections[k]) > len(result["sections"][k]):
                result["sections"][k] = llm_sections[k]

    return result