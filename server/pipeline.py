from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import requests
from utils import extract_sections, calculate_heuristic_scores, extract_rule_based_skills, chunk_text, clean_output
from validation import validate_analyze_output, validate_advanced_output

print("Loading Embedding Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

def query_ollama(prompt, timeout=300):
    try:
        print(f"Sending request to Ollama...")
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "format": "json",
                "prompt": prompt,
                "stream": False
            },
            timeout=timeout
        )
        return response.json().get("response", "{}")
    except Exception as e:
        print(f"Ollama Error: {e}")
        return "{}"

def build_faiss_context(text, job_description):
    chunks = chunk_text(text, chunk_size=500)
    if not chunks: return ""
    embeddings = model.encode(chunks)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings))
    
    query_embedding = model.encode([job_description])
    # Protect against asking for more chunks than exist
    k = min(5, len(chunks))
    if k == 0: return ""
    
    D, I = index.search(np.array(query_embedding), k=k)
    
    relevant_indices = [i for i in I[0] if i < len(chunks)]
    relevant_chunks = [chunks[i] for i in relevant_indices]
    return "\n\n".join(relevant_chunks)

def run_hybrid_pipeline(text, job_description):
    # Rule-Based Phase
    sections = extract_sections(text)
    heuristics = calculate_heuristic_scores(text, sections)
    heuristics["sections"] = sections
    
    rule_skills = extract_rule_based_skills(text)
    
    # Context Phase
    context = build_faiss_context(text, job_description)
    
    # LLM Phase (Strict Mode)
    prompt = f"""
    You are an ATS system. Extract structured data from the resume.
    Return ONLY valid JSON.
    
    Rules:
    - Do NOT infer or guess skills.
    - Only include exact matches from text.
    - Sections MUST be extracted strictly from the provided context. If a section is missing in context, leave it blank.
    
    {{
    "match_score": 0-100,
    "keyword_match_score": 0-100,
    "matched_skills": [],
    "missing_skills": [],
    "sections": {{
        "skills": "",
        "experience": "",
        "education": "",
        "projects": ""
    }}
    }}
    
    Resume Context:
    {context}
    
    Job Description:
    {job_description}
    """
    
    raw_response = query_ollama(prompt, timeout=300)
    cleaned = clean_output(raw_response)
    
    # Merge Rule-based skills into LLM skills
    llm_skills = cleaned.get("matched_skills", [])
    if isinstance(llm_skills, list):
        combined_skills = list(set([str(s).lower() for s in llm_skills] + rule_skills))
        cleaned["matched_skills"] = sorted(combined_skills)
    else:
        cleaned["matched_skills"] = sorted(rule_skills)
        
    # Validation Phase
    validated = validate_analyze_output(cleaned, heuristics)
    return validated

def run_advanced_pipeline(text, job_description):
    # Rule-Based Phase
    sections = extract_sections(text)
    heuristics = calculate_heuristic_scores(text, sections)
    heuristics["sections"] = sections
    
    rule_skills = extract_rule_based_skills(text)
    # Format structured context instead of raw RAG for full rewrite
    structured_context = f"""
    Summary: {sections['summary']}
    Skills: {sections['skills']}
    Experience: {sections['experience']}
    Projects: {sections['projects']}
    Education: {sections['education']}
    Achievements: {sections['achievements']}
    """
    
    # LLM Phase
    prompt = f"""
    You are an advanced ATS + resume optimization system.
    Return ONLY valid JSON. No markdown, no explanation.

    {{
      "improved_points": [
        {{"original": "weak bullet", "improved": "strong bullet with metrics"}}
      ],
      "rewritten_resume": {{
        "summary": "Full professional summary...",
        "skills": ["python", "react"],
        "experience": [
          {{
            "role": "Software Engineer",
            "company": "Tech Corp",
            "duration": "2020 - 2023",
            "points": ["Developed a fast API..."]
          }}
        ],
        "projects": [
          {{
            "name": "AI Tool",
            "description": "Built a system..."
          }}
        ],
        "education": [
          {{
            "degree": "B.S. Computer Science",
            "institution": "University",
            "year": "2020"
          }}
        ],
        "achievements": ["Award 1"]
      }},
      "matched_skills": [],
      "missing_skills": [],
      "recommended_skills": [],
      "skill_distribution": [
        {{"skill": "python", "level": "high"}}
      ]
    }}

    Rules for Skill Extraction:
    - Do NOT infer or guess matched skills. Extract ONLY what is explicitly mentioned.

    Rewrite 3-4 weak bullet points.
    Then generate a COMPLETE, fully rewritten, highly professional version of the resume.
    You MUST include all sections (summary, skills, experience, projects, education, achievements).
    If a section is missing from the resume, return an empty string/array for it. Do NOT skip the key.

    Resume Context (Structured):
    {structured_context}

    Job Description:
    {job_description}
    """
    
    raw_response = query_ollama(prompt, timeout=600)
    cleaned = clean_output(raw_response)
    
    # Merge Rule-based skills into LLM skills
    llm_skills = cleaned.get("matched_skills", [])
    if isinstance(llm_skills, list):
        combined_skills = list(set([str(s).lower() for s in llm_skills] + rule_skills))
        cleaned["matched_skills"] = sorted(combined_skills)
    else:
        cleaned["matched_skills"] = sorted(rule_skills)

    # Validation Phase
    validated = validate_advanced_output(cleaned, heuristics)
    return validated
