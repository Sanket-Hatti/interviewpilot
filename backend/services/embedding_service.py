"""
Embedding Service for InterviewPilot RAG Layer.
Supports multiple embedding providers:
1. FastEmbed (local ONNX BAAI/bge-small-en-v1.5, 384-dim, default)
2. OpenAI (text-embedding-3-small with dimensions=384, if OPENAI_API_KEY configured)
3. Deterministic semantic projection fallback
"""

import os
import re
import math
import hashlib
import logging
from typing import List, Union

logger = logging.getLogger(__name__)

EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "384"))
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "auto").lower()

_fastembed_model = None
_openai_client = None


def _get_fastembed_model():
    global _fastembed_model
    if _fastembed_model is None:
        try:
            from fastembed import TextEmbedding
            # BAAI/bge-small-en-v1.5 produces high-quality 384-dimensional dense vectors
            _fastembed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
            logger.info("FastEmbed TextEmbedding initialized with BAAI/bge-small-en-v1.5 (dim=384)")
        except Exception as e:
            logger.warning(f"FastEmbed initialization failed: {e}")
            _fastembed_model = False
    return _fastembed_model if _fastembed_model is not False else None


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                from openai import OpenAI
                _openai_client = OpenAI(api_key=api_key)
                logger.info("OpenAI client initialized for embeddings")
            except Exception as e:
                logger.warning(f"OpenAI client initialization failed: {e}")
                _openai_client = False
        else:
            _openai_client = False
    return _openai_client if _openai_client is not False else None


def _deterministic_semantic_vector(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    Deterministic semantic projection fallback based on subwords and character n-grams.
    Normalized with L2 norm so cosine similarity calculations are mathematically valid.
    """
    tokens = re.findall(r"\w+", (text or "").lower())
    vec = [0.0] * dim
    if not tokens:
        return vec

    for token in tokens:
        # Full token hash
        h = int(hashlib.sha256(token.encode("utf-8")).hexdigest()[:8], 16)
        idx = h % dim
        vec[idx] += 1.0

        # Subword n-grams for semantic similarity between related words (e.g. 'pythonic' ~ 'python')
        if len(token) >= 3:
            for i in range(len(token) - 2):
                gram = token[i:i + 3]
                gh = int(hashlib.md5(gram.encode("utf-8")).hexdigest()[:6], 16)
                vec[gh % dim] += 0.35

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 6) for x in vec]
    return vec


def generate_embedding(text: str) -> List[float]:
    """Generate a single embedding vector (384-dimensional list of floats)."""
    res = generate_embeddings([text])
    return res[0] if res else [0.0] * EMBEDDING_DIM


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embedding vectors for a list of text strings."""
    if not texts:
        return []

    clean_texts = [t.strip() if t and t.strip() else " " for t in texts]

    # 1. Check OpenAI if provider requested or configured
    if EMBEDDING_PROVIDER == "openai" or (EMBEDDING_PROVIDER == "auto" and os.getenv("OPENAI_API_KEY")):
        client = _get_openai_client()
        if client:
            try:
                model_name = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
                # text-embedding-3-small supports the dimensions parameter
                response = client.embeddings.create(
                    input=clean_texts,
                    model=model_name,
                    dimensions=EMBEDDING_DIM
                )
                return [item.embedding for item in response.data]
            except Exception as e:
                logger.warning(f"OpenAI embedding call failed, falling back: {e}")

    # 2. Check FastEmbed (local ONNX model)
    fastembed_model = _get_fastembed_model()
    if fastembed_model:
        try:
            embeddings_iter = fastembed_model.embed(clean_texts)
            return [emb.tolist() if hasattr(emb, "tolist") else list(emb) for emb in embeddings_iter]
        except Exception as e:
            logger.warning(f"FastEmbed embedding call failed, falling back: {e}")

    # 3. Deterministic semantic projection fallback
    logger.info("Using deterministic semantic vector projection fallback")
    return [_deterministic_semantic_vector(t, EMBEDDING_DIM) for t in clean_texts]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)
