# ATS Resume Optimizer

Production-grade AI resume optimizer built with Next.js 14, LlamaParse, Groq (Llama 3.3 70B), and Puppeteer.

## Architecture

```
PDF / DOCX Upload
       │
       ▼
 LlamaParse API          ← vision-LLM, preserves tables/columns/layout
       │
       │  clean Markdown
       ▼
  Groq LLM              ← structures Markdown → typed ResumeData JSON
  (structurer)           (llama-3.3-70b-versatile, temp=0.1)
       │
       │  ResumeData JSON
       ├──────────────────────────────────────────────────────┐
       │                                                      │
       ▼                                                      ▼
  Groq LLM              ← Call 1: rewrite summary     Groq LLM ← Call 2: rewrite bullets
  (summary optimizer)    (temp=0.65)                  (bullets optimizer, temp=0.5)
       │                                                      │
       └──────────────────┬───────────────────────────────────┘
                          │
                          ▼
                   Merged ResumeData
                   (only summary + experience/internship bullets changed,
                    all other sections preserved verbatim)
                          │
                          ▼
                  Puppeteer PDF Generator
                  (headless Chrome → A4 PDF)
```

## Quick Start

### 1. Install

```bash
unzip ats-resume-optimizer.zip
cd ats-resume-optimizer
npm install
```

### 2. Get API Keys

| Service | URL | Cost |
|---------|-----|------|
| Groq AI | https://console.groq.com | Free |
| LlamaParse | https://cloud.llamaindex.ai | Free (1000 pages/day) |

### 3. Configure

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
GROQ_API_KEY=gsk_...
LLAMA_CLOUD_API_KEY=llx-...
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## Why LlamaParse?

Standard PDF extractors (`pdf-parse`, `pdfplumber`) do raw character extraction — they lose table structure, merge columns, and produce scrambled text from multi-column resume layouts.

LlamaParse uses a vision-language model that understands document layout. It outputs clean Markdown with:
- `##` headings for each section
- `-` bullet points preserved
- Tables converted to Markdown tables
- Multi-column layouts correctly linearised

This clean Markdown then feeds into Groq for structuring — resulting in near-perfect section detection regardless of resume format.

## Project Structure

```
ats-resume-optimizer/
├── app/
│   ├── page.tsx                     ← Main UI
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── parse/route.ts           ← File upload → LlamaParse → Groq structure
│       ├── optimize/route.ts        ← Groq 2-call optimizer
│       └── generate-pdf/route.ts   ← Puppeteer A4 PDF
├── lib/
│   ├── types.ts                     ← Full ResumeData model
│   ├── groqClient.ts                ← Groq SDK wrapper
│   ├── llamaParseClient.ts          ← LlamaParse REST client (upload/poll/fetch)
│   ├── resumeParser.ts              ← Orchestrates LlamaParse → Groq structuring
│   ├── resumeOptimizer.ts           ← 2-call optimizer with keyword injection
│   ├── htmlTemplate.ts              ← Section-order-driven HTML renderer
│   └── pdfGenerator.ts             ← Puppeteer PDF
└── .env.example
```

## Resume Data Model

All sections are preserved. Unknown sections go to `additionalSections[]`.

```typescript
{
  personal:           { name, email, phone, location, links[] }
  summary:            string
  experience:         [{ title, company, location, startDate, endDate, bullets[] }]
  education:          [{ degree, institution, location, startDate, endDate, gpa, notes }]
  certifications:     [{ name, issuer, date, credentialId }]
  awards:             [{ title, issuer, date, description }]
  publications:       [{ title, publisher, date, description, link }]
  internships:        [{ title, company, location, startDate, endDate, bullets[] }]
  projects:           [{ name, description, technologies[], bullets[], link }]
  skills:             string[]
  softSkills:         string[]
  additionalSections: [{ heading, rawContent, items[] }]  ← catches everything else
  sectionOrder:       string[]  ← preserves original document order
}
```

## Optimization Rules

The AI **only touches**:
- `summary` — rewritten to target the role (Call 1)
- `experience[].bullets` — power verbs + metrics + keywords (Call 2)
- `internships[].bullets` — same as experience (Call 2)

**Never modified**: education, certifications, awards, publications, projects, skills, additionalSections
