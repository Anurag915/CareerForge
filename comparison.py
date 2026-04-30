import utils
import llm

def compare_resumes(resume_list, job_description, top_n=None):
    """
    resume_list: list of dicts from db.get_resume()
    """
    comparison_results = []
    
    # 1. Rule-based Extraction (Deterministic)
    for resume in resume_list:
        # Calculate ATS score against JD
        ats_data = utils.calculate_ats_score(resume['raw_text'], job_description)
        
        metrics = {
            "id": resume['id'],
            "filename": resume['filename'],
            "ats_score": ats_data['ats_score'],
            "skills_count": utils.count_skills(resume['skills']),
            "projects_count": utils.count_projects(resume['projects']),
            "experience_years": utils.estimate_experience_years(resume['experience']),
            "matched_skills": ats_data['matched_skills'],
            "missing_skills": ats_data['missing_skills']
        }
        comparison_results.append(metrics)
        
    # Phase 4: Deterministic Ranking
    comparison_results.sort(key=lambda x: x['ats_score'], reverse=True)

    # Phase 5: Top N Selection
    if top_n and isinstance(top_n, int) and top_n > 0:
        print(f"DEBUG - SLICING TOP {top_n} CANDIDATES")
        comparison_results = comparison_results[:top_n]
        
    # 2. LLM Phase (Summary & Suggestions)
    context = ""
    for r in comparison_results:
        context += f"Candidate {r['filename']} (ATS: {r['ats_score']}%): {r['skills_count']} skills, {r['projects_count']} projects, {r['experience_years']} years exp.\n"
        
    prompt = f"""
    You are an expert talent acquisition consultant. Compare these top candidates against this Job Description:
    JD: {job_description[:2000]}
    
    Provide a brief summary of who is the best fit and why. 
    Also provide 1 high-impact suggestion for each.
    
    Return ONLY valid JSON.
    
    {{
    "overall_summary": "...",
    "individual_suggestions": [
        {{"id": "...", "suggestion": "..."}}
    ]
    }}
    
    Candidate Data:
    {context}
    """
    
    llm_response = llm.query_ollama(prompt, format_json=True)
    llm_data = utils.clean_output(llm_response)
    
    return {
        "metrics": comparison_results,
        "llm_analysis": llm_data
    }
