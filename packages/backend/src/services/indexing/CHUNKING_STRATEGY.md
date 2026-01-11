# TextChunker: Semantic Chunking Strategy for Scientific Papers

## Overview

The Kilig platform uses a **section-aware, semantic chunking strategy** specifically optimized for scientific papers. This approach preserves document structure and context boundaries, significantly improving retrieval quality for the Scientist agent.

## ✅ Strategy Analysis

### Current Implementation: **EXCELLENT**

The `TextChunker` in [`packages/backend/src/services/indexing/text-chunker.ts`](file:///Users/diegomarono/Startup/Kilig/packages/backend/src/services/indexing/text-chunker.ts) already implements best practices for scientific paper chunking.

---

## Chunking Hierarchy

### 1. Section-Based Chunking (Primary Strategy)

When paper sections are available from Docling MCP parsing:

**Header Prepending:**
- Every chunk includes: `{Title}\n\nAbstract: {Abstract}\n\n`
- Ensures context retention across all chunks

**Intelligent Section Filtering:**
```typescript
// Filters out metadata sections
isMetadataSection(title: string): boolean {
  const metadataIndicators = [
    'authors', 'affiliation', 'email',  
    'arxiv', 'preprint', 'submitted'
  ];
  // Returns true if section is metadata
}
```

**Duplicate Detection:**
- Uses word overlap analysis (>80% match = duplicate)
- Prevents redundant abstract chunks

**Adaptive Sizing:**

| Section Size | Strategy | Example |
|---|---|---|
| **< 100 words** | Combine with adjacent sections | References + Acknowledgments |
| **100-800 words** | Single chunk per section | Introduction, Methods |
| **> 800 words** | Split using word-based chunking | Results, Discussion |

**Benefits:**
- ✅ Preserves semantic boundaries (Introduction vs Methods vs Results)
- ✅ Each chunk self-contained with paper context
- ✅ Scientist agent can target specific sections

---

### 2. Word-Based Chunking (Fallback)

When sections unavailable or for large section splitting:

**Configuration:**
```typescript
{
  chunkSize: 800,      // words per chunk
  overlapSize: 200,     // overlapping words
  minChunkSize: 50     // minimum viable chunk
}
```

**Word-Boundary Aware:**
- Uses `/\S+/g` regex for word splitting
- Never splits mid-word
- Reconstructs with proper spacing

**Overlap Strategy:**
```typescript
currentPosition += this.chunkSize - this.overlapSize;
// Results in 200-word overlap between consecutive chunks
```

---

## Example: Processing a Physics Paper

### Input

```
Title: Quantum Entanglement in Cold Atoms
Abstract: We demonstrate...

1. Introduction
   The phenomenon of quantum entanglement... (250 words)

2. Experimental Setup  
   Our apparatus consists of... (450 words)

3. Results
   Figure 1 shows the correlation... (1200 words)

4. Discussion
   The observed entanglement rates... (350 words)

References
   [1] Einstein, A. et al...
```

### Output Chunks

**Chunk 1** (Introduction):
```
Quantum Entanglement in Cold Atoms

Abstract: We demonstrate...

Section: Introduction

The phenomenon of quantum entanglement... (full 250 words)
```

**Chunk 2** (Experimental Setup):
```
Quantum Entanglement in Cold Atoms

Abstract: We demonstrate...

Section: Experimental Setup

Our apparatus consists of... (full 450 words)
```

**Chunk 3-4** (Results - split):
```
// Chunk 3
Quantum Entanglement in Cold Atoms

Abstract: We demonstrate...

Section: Results (Part 1)

Figure 1 shows the correlation... (800 words with 200-word overlap)

// Chunk 4  
Section: Results (Part 2)
... (remaining 600 words)
```

**Chunk 5** (Discussion):
```
Quantum Entanglement in Cold Atoms

Abstract: We demonstrate...

Section: Discussion

The observed entanglement rates... (350 words)
```

**Note**: References section filtered out as metadata.

---

## Why This Approach Works

### 1. Retrieval Quality

**Problem**: Traditional character-based chunking breaks mid-paragraph
```
Bad: "...the experiment showed\n\nChunk Break\n\n2. Methods\nOur approach..."
```

**Solution**: Section-aware chunking keeps semantic units intact
```
Good: Chunk 1 = "1. Introduction\n..." | Chunk 2 = "2. Methods\n..."
```

### 2. Agent Reasoning

**Scientist Agent Query**: "What methodology did they use?"

**Traditional Chunking**: Might retrieve:
- Part of introduction
- Middle of methods section  
- Random results snippet

**Section-Based Chunking**: Retrieves:
- Complete "Experimental Setup" section
- Complete "Methods" section
- Relevant methodology chunks with full context

### 3. Context Preservation

Every chunk contains:
- Paper title
- Abstract summary
- Section identifier
- Full section text (or coherent split)

**Result**: Agent always has paper context, never "orphaned" text fragments.

---

## Configuration

Located in [`packages/backend/src/config/index.ts`](file:///Users/diegomarono/Startup/Kilig/packages/backend/src/config/index.ts):

```typescript
chunking: {
  chunkSize: 800,        // Optimal for scientific papers
  overlapSize: 200,      // Prevents context loss at boundaries
  minChunkSize: 50       // Filters out noise chunks
}
```

**Tuning Recommendations:**
- ✅ **Keep current values** - already optimized
- If papers are very dense: increase to 1000 words
- If performance issues: reduce to 600 words
- Always maintain 20-25% overlap ratio

---

## Testing Coverage

See [`packages/backend/src/services/indexing/text-chunker.test.ts`](file:///Users/diegomarono/Startup/Kilig/packages/backend/src/services/indexing/text-chunker.test.ts):

✅ Section-based chunking with various formats  
✅ Metadata filtering  
✅ Duplicate abstract detection  
✅ Small section combination  
✅ Large section splitting  
✅ Word-based fallback  
✅ Edge cases (empty text, minimal content)

---

## Comparison to Alternatives

| Approach | Pros | Cons | Kilig Choice |
|---|---|---|---|
| **Fixed character chunks** | Simple, fast | Breaks mid-sentence | ❌ Not used |
| **Sentence-based** | Clean boundaries | Loses section context | ❌ Not used |
| **Paragraph-based** | Better than chars | Still loses structure | ❌ Not used |
| **Section-aware** | Preserves semantics | Requires parsing | ✅ **Primary** |
| **Semantic embeddings** | Optimal clustering | Very slow, expensive | 🔮 Future |

---

## Future Enhancements

### Optional: Semantic Similarity Chunking

Instead of fixed sizes, chunk based on semantic shifts:

```python
# Pseudocode
def semantic_chunk(paragraphs):
    chunks = []
    current_chunk = [paragraphs[0]]
    
    for p in paragraphs[1:]:
        similarity = cosine_similarity(
            embed(current_chunk), 
            embed(p)
        )
        
        if similarity < threshold:  # Topic shift detected
            chunks.append(current_chunk)
            current_chunk = [p]
        else:
            current_chunk.append(p)
```

**When to implement:** If papers have non-standard structures or retrieval quality drops.

---

## Recommendations

> [!NOTE]
> **The current chunking strategy is production-ready and requires no immediate changes.**

✅ **Keep using section-based chunking**  
✅ **Maintain current chunk sizes (800/200)**  
✅ **Ensure Docling MCP provides good section parsing**  
⚠️ **Monitor**: If many papers lack sections, improve Docling prompts

---

## Integration Points

**Used by:**
- [`HybridIndexer`](file:///Users/diegomarono/Startup/Kilig/packages/backend/src/services/indexing/hybrid-indexer.ts#L53-L60) - calls `chunkPaper()`
- [`CLI index-paper`](file:///Users/diegomarono/Startup/Kilig/packages/backend/src/commands/index-paper.ts) - via HybridIndexer
- Airflow `paper_ingestion_dag` - will use CLI

**Feeds into:**
- OpenSearch hybrid index (BM25 + vector)
- Scientist agent retrieval
- Self-RAG evaluation pipeline

---

## Conclusion

**Status**: ✅ **EXCELLENT** - No action required

The TextChunker implements industry best practices for scientific paper chunking:
- Semantic boundaries preserved
- Context always available
- Optimized for agent reasoning
- Robust error handling

This is a **strength** of the architecture, not a weakness to fix.
