from utils import extract_text, chunk_text, clean_output, validate_output
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Step 1: Extract text
text = extract_text("AnuragResume.pdf")

# Step 2: Chunk text
chunks = chunk_text(text)

# Step 3: Create embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(chunks)

# Step 4: Store in FAISS
dim = embeddings.shape[1]
index = faiss.IndexFlatL2(dim)

index.add(np.array(embeddings))

print("FAISS index created successfully!")

# Step 5: Query
query = "skills and experience in machine learning"

query_embedding = model.encode([query])

# Step 6: Search in FAISS
D, I = index.search(np.array(query_embedding), k=3)

# Step 7: Get relevant chunks
relevant_chunks = [chunks[i] for i in I[0]]

context = " ".join(relevant_chunks)

print("\n--- Retrieved Context ---\n")
print(context[:500])  # preview

import requests

def analyze_with_ollama(context):
    response = requests.post(
    "http://localhost:11434/api/generate",
    json={
        "model": "llama3",
        "prompt": f"""
Analyze this resume and return JSON:

{{
  "score": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}}

Resume:
{context}
""",
        "stream": False   # 🔥 IMPORTANT FIX
    }
)

    return response.json()["response"]

# result = analyze_with_ollama(context)

# print("\n--- FINAL ANALYSIS ---\n")
# print(result)

result = analyze_with_ollama(context)

cleaned = clean_output(result)
validated = validate_output(cleaned)

print(validated)
print("\n--- CLEAN JSON ---\n")
print(cleaned)