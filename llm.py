import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3" # You can change this to phi3 if preferred

def query_ollama(prompt, format_json=True, timeout=300):
    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False
    }
    if format_json:
        payload["format"] = "json"
        
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        print(f"Ollama Error: {e}")
        return "{}" if format_json else "Error: Could not connect to Ollama."

def get_chat_response(context, question):
    # Context Optimization: Truncate if somehow context exceeds safe limits
    max_context_chars = 4000 
    safe_context = context[:max_context_chars]

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) Assistant.
    Your task is to answer questions about a candidate's resume based ONLY on the provided context.
    
    Rules:
    - If the information is not present in the context, explicitly state: "Based on the provided resume, I do not have information regarding [topic]."
    - Be professional, concise, and accurate.
    - Do not invent facts or hallucinate experience.

    ---
    RESUME CONTEXT:
    {safe_context}
    ---

    USER QUESTION: {question}
    
    EXPERT ANSWER:
    """
    return query_ollama(prompt, format_json=False)

def analyze_resume_ats(sections, job_description):
    # Format the sections into a clean string for the LLM
    context = ""
    for title, content in sections.items():
        if content:
            context += f"### {title.upper()}\n{content}\n\n"

    prompt = f"""
    You are an expert ATS system. Analyze the following structured resume sections against the job description.
    Return ONLY valid JSON.
    
    {{
    "summary_critique": "Brief overview of alignment between resume and JD",
    "advanced_enhancements": [
        "Actionable suggestion 1",
        "Actionable suggestion 2",
        "Actionable suggestion 3"
    ]
    }}
    
    Rules for Advanced Enhancements:
    - Must be actionable (e.g., 'Add metrics to project X' instead of 'Improve projects').
    - Minimum 3-5 suggestions.
    - Focus on increasing the ATS score.
    - Focus on fixing missing skills and weak section descriptions.
    
    Resume Context:
    {context[:5000]}
    
    Job Description:
    {job_description}
    """
    print(f"DEBUG - SENDING STRUCTURED CONTEXT TO LLM ({len(context)} chars)")
    return query_ollama(prompt, format_json=True)
def get_global_chat_response(context, question):
    prompt = f"""
    You are an AI career strategist. Use the following context, which contains information from multiple documents (resumes, job descriptions, and portfolios), to answer the user's question.
    
    Context:
    {context}
    
    Question: {question}
    
    Strategic Answer:
    """
    return query_ollama(prompt, format_json=False)
