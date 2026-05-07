import requests
import json
import os

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_URL = f"{OLLAMA_HOST}/api/generate"
DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'llama3')

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
    - DO NOT use long paragraphs.
    - Use bullet points (•) for your response.
    - Each point should start on a new line.
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
    You are an expert ATS system. Your goal is to analyze the resume against the provided job description with high precision.
    Return ONLY valid JSON.
    
    {{
    "summary_critique": "A professional analysis of how well the candidate matches the JD. If the JD is invalid/gibberish, state that no analysis could be performed.",
    "advanced_enhancements": [
        "Specifically matched suggestion 1",
        "Specifically matched suggestion 2"
    ]
    }}
    
    STRICT RULES:
    1. If the Job Description contains gibberish, meaningless text, or lacks clear professional requirements, return an empty list for "advanced_enhancements".
    2. Do NOT hallucinate skills or suggest common technologies (like Python/SQL) unless they are explicitly required by the JD or missing from the resume based on the JD.
    3. Suggest enhancements ONLY if they directly increase the match for the SPECIFIC JD provided.
    4. If the JD is empty or invalid, return "summary_critique": "The provided job description is invalid or too short for analysis."
    
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
    
    Strategic Answer (Use bullet points, no paragraphs):
    """
    return query_ollama(prompt, format_json=False)
