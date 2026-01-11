---
name: pdf-processing
description: Process PDF files including text extraction, merging, splitting, form filling, and OCR. Use for document manipulation, data extraction, or PDF generation. Triggers on requests to "extract from PDF", "merge PDFs", "fill PDF form", or process PDF documents.
---

# PDF Processing

## Quick Start

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("document.pdf")
for page in reader.pages:
    text = page.extract_text()
```

## Common Operations

| Task | Tool | Key Function |
|------|------|--------------|
| Merge PDFs | pypdf | `writer.add_page(page)` |
| Split PDFs | pypdf | One page per file |
| Extract text | pdfplumber | `page.extract_text()` |
| Extract tables | pdfplumber | `page.extract_tables()` |
| Create PDFs | reportlab | Canvas or Platypus |
| OCR scanned | pytesseract | Convert to image first |
| Fill forms | pdf-lib or pypdf | See forms.md |

## Libraries

- **pypdf**: Basic operations (merge, split, rotate, encrypt)
- **pdfplumber**: Text and table extraction with layout
- **reportlab**: Create new PDFs programmatically
- **pytesseract + pdf2image**: OCR for scanned PDFs

## Command Line

```bash
# Extract text with layout
pdftotext -layout input.pdf output.txt

# Merge with qpdf
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf
```

## Reference Files

- `reference.md` - Advanced features, JavaScript libraries
- `forms.md` - PDF form filling instructions
