import os
import pickle
import logging
import threading
from contextlib import contextmanager
import redis
import hashlib
from config import settings

logger = logging.getLogger(__name__)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "data", "vector_store")
MODEL_NAME = settings.embedding_model

if not os.path.exists(VECTOR_STORE_DIR):
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

_model = None
_faiss = None
_numpy = None
_model_lock = threading.Lock()
_index_lock = threading.RLock()


def global_index_paths(user_id):
    tenant_key = hashlib.sha256(str(user_id).encode("utf-8")).hexdigest()
    return (
        os.path.join(VECTOR_STORE_DIR, f"tenant-{tenant_key}.index"),
        os.path.join(VECTOR_STORE_DIR, f"tenant-{tenant_key}.metadata"),
    )


def global_index_exists(user_id):
    index_path, metadata_path = global_index_paths(user_id)
    return os.path.exists(index_path) and os.path.exists(metadata_path)


@contextmanager
def global_index_lock(user_id):
    """Coordinate global FAISS writes across threads, processes, and hosts."""
    with _index_lock:
        distributed_lock = None
        try:
            client = redis.Redis.from_url(
                settings.socket_redis_url,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            distributed_lock = client.lock(
                f"careerforge:rag:tenant-index:{hashlib.sha256(str(user_id).encode()).hexdigest()}",
                timeout=60,
                blocking_timeout=5,
            )
            if not distributed_lock.acquire(blocking=True):
                raise TimeoutError("Could not acquire the global vector-index lock")
        except Exception:
            if settings.is_production:
                raise
            logger.warning("distributed_vector_lock_unavailable; using_process_lock")
            distributed_lock = None
        try:
            yield
        finally:
            if distributed_lock is not None:
                try:
                    distributed_lock.release()
                except redis.exceptions.LockError:
                    logger.warning("distributed_vector_lock_expired")


def get_model():
    """Load the embedding model only when a worker actually needs it."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info("embedding_model_loading model=%s", MODEL_NAME)
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer(MODEL_NAME)
                logger.info("embedding_model_loaded model=%s", MODEL_NAME)
    return _model


def get_vector_dependencies():
    """Import native vector libraries only inside processes that use RAG."""
    global _faiss, _numpy
    if _faiss is None or _numpy is None:
        with _model_lock:
            if _faiss is None:
                import faiss
                _faiss = faiss
            if _numpy is None:
                import numpy
                _numpy = numpy
    return _faiss, _numpy

def chunk_text(text, chunk_size=500):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def create_index(doc_id, text, doc_type="resume", user_id=None):
    faiss, np = get_vector_dependencies()
    chunks = chunk_text(text)
    if not chunks:
        return False
        
    embeddings = get_model().encode(chunks)
    dim = embeddings.shape[1]
    
    # 1. Create Per-Doc Index (for single-doc chat)
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings))
    
    index_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.index")
    chunks_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.chunks")
    
    with _index_lock:
        faiss.write_index(index, index_path)
        with open(chunks_path, 'wb') as f:
            pickle.dump(chunks, f)
        
    # 2. Add to Global Index (for cross-doc RAG)
    add_to_global_index(doc_id, doc_type, text, user_id)
    
    return True

def add_to_global_index(doc_id, doc_type, text, user_id):
    faiss, np = get_vector_dependencies()
    if not user_id:
        raise ValueError("user_id is required for tenant-safe indexing")
    chunks = chunk_text(text)
    if not chunks: return
    
    embeddings = get_model().encode(chunks)
    index_path, metadata_path = global_index_paths(user_id)

    with global_index_lock(user_id):
        if os.path.exists(index_path):
            index = faiss.read_index(index_path)
            with open(metadata_path, 'rb') as f:
                metadata = pickle.load(f)
        else:
            dim = embeddings.shape[1]
            index = faiss.IndexFlatL2(dim)
            metadata = []

        index.add(np.array(embeddings))
        for chunk in chunks:
            metadata.append({"doc_id": doc_id, "user_id": user_id, "type": doc_type, "text": chunk})

        faiss.write_index(index, index_path)
        with open(metadata_path, 'wb') as f:
            pickle.dump(metadata, f)

def query_index(doc_id, query, k=3):
    faiss, np = get_vector_dependencies()
    index_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.index")
    chunks_path = os.path.join(VECTOR_STORE_DIR, f"{doc_id}.chunks")
    
    if not os.path.exists(index_path) or not os.path.exists(chunks_path):
        return ""
        
    with _index_lock:
        index = faiss.read_index(index_path)
        with open(chunks_path, 'rb') as f:
            chunks = pickle.load(f)
        
    query_embedding = get_model().encode([query])
    D, I = index.search(np.array(query_embedding), k=min(k, len(chunks)))
    
    relevant_chunks = [chunks[i] for i in I[0] if i < len(chunks)]
    return "\n\n".join(relevant_chunks)

def query_global_index(user_id, query, k=5):
    faiss, np = get_vector_dependencies()
    if not user_id:
        raise ValueError("user_id is required for tenant-safe retrieval")
    index_path, metadata_path = global_index_paths(user_id)
    if not os.path.exists(index_path) or not os.path.exists(metadata_path):
        return "No documents indexed yet."
        
    with global_index_lock(user_id):
        index = faiss.read_index(index_path)
        with open(metadata_path, 'rb') as f:
            metadata = pickle.load(f)
        
    query_embedding = get_model().encode([query])
    search_k = min(k, len(metadata))
    D, I = index.search(np.array(query_embedding), k=search_k)
    
    results = []
    for i in I[0]:
        if i < len(metadata) and metadata[i].get("user_id") == user_id:
            meta = metadata[i]
            results.append(f"[{meta['type'].upper()} ({meta['doc_id']})]: {meta['text']}")
            if len(results) >= k:
                break
            
    return "\n\n".join(results)
