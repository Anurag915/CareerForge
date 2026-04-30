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
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end != -1:
                return json.loads(text[start:end])
            return {"error": "No JSON found", "raw": text}
        except:
            return {"error": "Invalid JSON", "raw": text}

def extract_sections(text):
    """
    Intelligent section parser that detects both standard and custom sections.
    Uses pattern matching for headers and maps synonyms to canonical keys.
    """
    sections = {
        "summary": "",
        "skills": "",
        "experience": "",
        "education": "",
        "projects": "",
        "achievements": "",
        "other_sections": {}
    }
    
    # Mapping for normalization
    synonyms = {
        "projects": ["projects", "personal projects", "academic projects", "key projects", "notable projects", "key contributions", "projects & tools"],
        "experience": ["experience", "work experience", "professional experience", "employment", "history", "work history", "professional background", "professional highlights", "career history"],
        "skills": ["skills", "technical skills", "core skills", "skill set", "core competencies", "technologies", "expertise", "technical expertise", "skills & tools", "competencies"],
        "education": ["education", "academic background", "qualifications", "academic", "educational background", "educational qualifications"],
        "summary": ["summary", "profile", "objective", "professional summary", "about me", "personal profile", "executive summary"],
        "achievements": ["achievements", "certifications", "awards", "honors", "licenses", "publications", "honors & awards", "achievements & certifications", "achievements and certifications"]
    }
    
    lines = text.split('\n')
    current_section = None
    detected_headers = []
    
    # Simple blacklist to avoid names/noise being treated as headers
    HEADER_BLACKLIST = ["anurag prajapati", "curriculum vitae", "resume", "contact", "details"]
    
    print(f"DEBUG - STARTING FLEXIBLE EXTRACTION ON {len(lines)} LINES")
    
    for line in lines:
        stripped = line.strip()
        if not stripped or len(stripped) < 3: continue
        
        # 1. Detect if line is a potential header
        # Criteria: ALL CAPS (and short), or ends with ':', or matches a known synonym
        is_all_caps = stripped.isupper() and len(stripped) < 40
        ends_with_colon = stripped.endswith(':') and len(stripped) < 40
        
        # Check against synonym lists
        comp_line = re.sub(r'[^a-z]', '', stripped.lower())
        
        if any(b in stripped.lower() for b in HEADER_BLACKLIST):
            is_header = False
            matched_canonical = None
        else:
            matched_canonical = None
            for canonical, words in synonyms.items():
                for word in words:
                    if comp_line == re.sub(r'[^a-z]', '', word.lower()):
                        matched_canonical = canonical
                        break
                if matched_canonical: break
            
            is_header = matched_canonical or is_all_caps or ends_with_colon
        
        if is_header:
            header_name = stripped.lower().replace(':', '').strip()
            detected_headers.append(header_name)
            
            if matched_canonical:
                current_section = matched_canonical
            else:
                # Custom section -> other_sections
                current_section = f"other_{header_name}"
                if header_name not in sections["other_sections"]:
                    sections["other_sections"][header_name] = ""
            
            print(f"DEBUG - DETECTED HEADER: '{stripped}' -> MAPS TO: {current_section}")
            continue
            
        # 2. Append content to current section
        if current_section:
            if current_section.startswith("other_"):
                key = current_section.replace("other_", "")
                sections["other_sections"][key] += line + "\n"
            else:
                sections[current_section] += line + "\n"
                
    # Cleanup trailing newlines
    for k in sections:
        if k == "other_sections":
            for ok in sections[k]:
                sections[k][ok] = sections[k][ok].strip()
        else:
            sections[k] = sections[k].strip()
            
    print("DETECTED HEADERS:", detected_headers)
    print("FINAL SECTIONS:", {k: (len(v) if k != "other_sections" else list(v.keys())) for k, v in sections.items()})
    
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

def extract_rule_based_skills(text):
    """Predefined tech stack list to guarantee explicit extraction."""
    TECH_STACK = {
        "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust", "php", "swift",
        "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "fastapi", "spring boot",
        "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "github actions", "gitlab ci",
        "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
        "html", "css", "tailwind", "bootstrap", "sass",
        "git", "linux", "bash", "agile", "scrum", "jira", "figma",
        "kafka", "rabbitmq", "graphql", "rest api"
    }
    
    text_lower = text.lower()
    padded_text = f" {text_lower} "
    
    extracted = set()
    for skill in TECH_STACK:
        # Match standalone words/phrases
        pattern = r'(?<=[\s,.:;()\[\]{}])' + re.escape(skill) + r'(?=[\s,.:;()\[\]{}])'
        if re.search(pattern, padded_text):
            extracted.add(skill)
            
    return list(extracted)

def calculate_ats_score(resume_text, jd_text):
    """
    PHASE 1: Deterministic ATS Scoring
    score = (matched_skills / total_jd_skills) * 100
    """
    if not jd_text or not resume_text:
        return {
            "ats_score": 0,
            "matched_skills": [],
            "missing_skills": []
        }

    # 1. Extract skills from both
    resume_skills = set(extract_rule_based_skills(resume_text))
    jd_skills = set(extract_rule_based_skills(jd_text))
    
    if not jd_skills:
        # If no skills found in JD, we use a default high score if resume has any skills,
        # or handle it gracefully. Here we'll say 100% if resume has skills, 0% if not.
        return {
            "ats_score": 100 if resume_skills else 0,
            "matched_skills": list(resume_skills),
            "missing_skills": []
        }
    
    # 2. Find matches
    matched = resume_skills.intersection(jd_skills)
    missing = jd_skills - resume_skills
    
    # 3. Compute score
    score = (len(matched) / len(jd_skills)) * 100
    final_score = round(score)
    
    print(f"DEBUG - DETERMINISTIC ATS SCORE: {final_score}% ({len(matched)}/{len(jd_skills)})")
    
    return {
        "ats_score": final_score,
        "matched_skills": list(matched),
        "missing_skills": list(missing)
    }

def count_skills(skills_text):
    if not skills_text: return 0
    skills = re.split(r'[,|•\n]', skills_text)
    return len([s.strip() for s in skills if len(s.strip()) > 1])

def count_projects(projects_text):
    if not projects_text: return 0
    lines = projects_text.split('\n')
    return max(1, len([l for l in lines if len(l.strip()) > 20]) // 2)

def estimate_experience_years(experience_text):
    if not experience_text: return 0
    years = re.findall(r'20\d{2}', experience_text)
    if not years: return 0
    int_years = sorted(list(set([int(y) for y in years])))
    if len(int_years) < 2: return 1
    return int_years[-1] - int_years[0]