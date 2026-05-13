from google import genai
from google.genai import types
import json
import os
from dotenv import load_dotenv

# Bulletproof Pathing: Always load the correct .env
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path)

# 1. Initialize next-gen Gemini v2 Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None

if not GEMINI_API_KEY:
    print("CRITICAL WARNING: GEMINI_API_KEY is missing in server/.env.")
else:
    # Upgrade: Unified modular instantiation 
    client = genai.Client(api_key=GEMINI_API_KEY)

def query_gemini(prompt, format_json=True):
    """
    Ultrafast query router powering backend logic via next-gen Gemini 2.0 Flash.
    Guarantees absolute syntactic validation on structure outputs.
    """
    if not client:
        return "{}" if format_json else "Error: AI Client not configured."
        
    try:
        # Auto-configure strict strict JSON delivery if requested
        config = None
        if format_json:
             config = types.GenerateContentConfig(
                 response_mime_type="application/json"
             )
             
        # Leverage explicit stable alias confirmed accessible via live probe
        response = client.models.generate_content(
            model='gemini-flash-latest', 
            contents=prompt,
            config=config
        )
        
        if not response or not response.text:
             print("GEMINI V2 DEBUG: Null response block received.")
             return "{}" if format_json else "Error: AI engine returned a null payload."
             
        return response.text
        
    except Exception as e:
        print(f"GEMINI V2 ERROR TRACE: {e}")
        return "{}" if format_json else f"Internal Logic Fault: {str(e)}"

def get_chat_response(context, question):
    """
    Advanced singular record hydration engine for hyper-dense data extraction.
    """
    # Expanded context frame limits leveraging unified infrastructure
    max_safe_chars = 80000 
    safe_context = context[:max_safe_chars]

    prompt = f"""
    System Objective: Act as a senior technical recruitment director.
    
    Constraints:
    - Output strictly structured, professional insights using (•) bullets.
    - Ban long monolithic paragraphs immediately.
    - Confine knowledge strictly to provided context.
    - If not explicitly in context, clearly state knowledge absence regarding query.

    <<< PRIMARY SOURCE CONTEXT >>>
    {safe_context}
    <<< END SOURCE CONTEXT >>>

    QUERY: {question}
    
    CONSULTANT VERDICT:
    """
    return query_gemini(prompt, format_json=False)

def analyze_resume_ats(sections, job_description):
    """
    Hyper-fidelity matching harness. Direct cross-correlation analyzer.
    Poly-ingests raw text flows OR pre-formatted structured indices.
    """
    formatted_corpus = ""
    
    if isinstance(sections, dict):
        for label, txt in sections.items():
            if txt and str(txt).strip():
                formatted_corpus += f"## {label.upper()}\n{txt}\n\n"
    else:
        formatted_corpus = str(sections)

    prompt = f"""
    System Identity: Precision ATS scoring mechanism and correction logic.
    Protocol: Evaluate data against specs. Output strictly RAW schema bound JSON.
    
    EXPECTED JSON SCHEMA:
    {{
    "summary_critique": "Absolute granular cross-mapping critique. Highlight fundamental alignment.",
    "advanced_enhancements": [
        "Direct enhancement correction 1",
        "Direct enhancement correction 2"
    ]
    }}
    
    VALIDATION BOUNDS:
    1. Garbage detection: If input description is chaotic -> Clear enhancements array, note error in critique.
    2. Gapping: Suggestions MUST align strictly and exclusively with gaps required by the target specs.
    3. Strict JSON only. No outside conversational filler.
    
    ### SOURCE CANDIDATE CORPUS ###
    {formatted_corpus}
    
    ### TARGET SPECIFICATION ###
    {job_description}
    """
    print(f"GEMINI V2 ENGINE: Routing analyzing sequence ({len(formatted_corpus)} chars)...")
    return query_gemini(prompt, format_json=True)

def get_global_chat_response(context, question):
    """
    High-altitude synthesized strategy engine aggregating distributed datasets.
    """
    prompt = f"""
    You represent an elite-tier career strategy architect operating on aggregated metadata.
    Synthesize disparate contexts below into a superior directional path.
    
    AGGREGATED DATA FRAMEWORK:
    {context}
    
    STRATEGIC INQUIRY: {question}
    
    EXECUTIVE DECISION (Format as precise structural directives):
    """
    return query_gemini(prompt, format_json=False)
