from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import os
import pickle

# Configuration
VECTOR_STORE_DIR = "data/vector_store"
MODEL_NAME = 'all-MiniLM-L6-v2'
GLOBAL_INDEX_PATH = os.path.join(VECTOR_STORE_DIR, "global.index")
GLOBAL_METADATA_PATH = os.path.join(VECTOR_STORE_DIR, "global.metadata")

if not os.path.exists(VECTOR_STORE_DIR):
    os.makedirs(VECTOR_STORE_DIR)

print("Loading Embedding Model...")
model = SentenceTransformer(MODEL_NAME)

def chunk_text(text, chunk_size=500):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def create_index(doc_id, text, doc_type="resume"):
    chunks = chunk_text(text)
    if not chunks:
        return False
        
    embeddings = model.encode(chunks)
    dim = embeddings.shape[1]
    
    # 1. Create Per-Doc Index (for single-doc chat)
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings))
    
    index_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.index")
    chunks_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.chunks")
    
    faiss.write_index(index, index_path)
    with open(chunks_path, 'wb') as f:
        pickle.dump(chunks, f)
        
    # 2. Add to Global Index (for cross-doc RAG)
    add_to_global_index(doc_id, doc_type, text)
    
    return True

def add_to_global_index(doc_id, doc_type, text):
    chunks = chunk_text(text)
    if not chunks: return
    
    embeddings = model.encode(chunks)
    
    if os.path.exists(GLOBAL_INDEX_PATH):
        index = faiss.read_index(GLOBAL_INDEX_PATH)
        with open(GLOBAL_METADATA_PATH, 'rb') as f:
            metadata = pickle.load(f)
    else:
        dim = embeddings.shape[1]
        index = faiss.IndexFlatL2(dim)
        metadata = []
        
    index.add(np.array(embeddings))
    for chunk in chunks:
        metadata.append({"doc_id": doc_id, "type": doc_type, "text": chunk})
        
    faiss.write_index(index, GLOBAL_INDEX_PATH)
    with open(GLOBAL_METADATA_PATH, 'wb') as f:
        pickle.dump(metadata, f)

def query_index(doc_id, query, k=3):
    index_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.index")
    chunks_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.chunks")
    
    if not os.path.exists(index_path) or not os.path.exists(chunks_path):
        return ""
        
    index = faiss.read_index(index_path)
    with open(chunks_path, 'rb') as f:
        chunks = pickle.load(f)
        
    query_embedding = model.encode([query])
    D, I = index.search(np.array(query_embedding), k=min(k, len(chunks)))
    
    relevant_chunks = [chunks[i] for i in I[0] if i < len(chunks)]
    return "\n\n".join(relevant_chunks)

def query_global_index(query, k=5):
    if not os.path.exists(GLOBAL_INDEX_PATH):
        return "No documents indexed yet."
        
    index = faiss.read_index(GLOBAL_INDEX_PATH)
    with open(GLOBAL_METADATA_PATH, 'rb') as f:
        metadata = pickle.load(f)
        
    query_embedding = model.encode([query])
    D, I = index.search(np.array(query_embedding), k=min(k, len(metadata)))
    
    results = []
    for i in I[0]:
        if i < len(metadata):
            meta = metadata[i]
            results.append(f"[{meta['type'].upper()} ({meta['doc_id']})]: {meta['text']}")
            
    return "\n\n".join(results)
