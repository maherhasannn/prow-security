# Prow Technical Description

## One-Sentence Technical Description

Prow is a secure AI workspace platform that enables enterprise teams to analyze sensitive documents (PDFs, Excel, CSV) and chat with their data using encrypted, organization-isolated workspaces with dual-mode AI support (secure offline via Ollama Cloud or Core via OpenAI with web search).

---

## High-Level Architecture

**Frontend:**
- Next.js 14 (App Router) with TypeScript
- React Server Components + Client Components
- Tailwind CSS + Framer Motion for UI
- Vercel Blob Storage for encrypted file storage

**Backend:**
- Next.js API Routes (serverless functions)
- PostgreSQL database (Drizzle ORM)
- Organization-scoped multi-tenancy with strict data isolation
- AES-256-GCM encryption at rest (organization-specific key derivation via PBKDF2)
- TLS 1.2+ in transit

**AI Layer:**
- Dual-mode architecture:
  - **Secure Mode**: Ollama Cloud (offline, no internet) - default for sensitive workspaces
  - **Internet-Enabled Mode**: OpenAI GPT-4o with web search via Serper API (optional)
- Document context injection via encrypted chunk retrieval
- Streaming responses supported for both modes

**Security Architecture:**
- Organization-level encryption keys (derived from master key + org ID)
- Workspace isolation within organizations
- Role-based access control (RBAC): owner, admin, member, viewer
- Full audit logging (uploads, AI queries, access)
- Policy-aware AI guardrails (sensitive pattern detection)

---

## Data Handling & Security

**Encryption:**
- **At Rest**: AES-256-GCM with organization-specific key derivation (PBKDF2, 100k iterations)
- **In Transit**: TLS 1.2+ (enforced by hosting platform)
- **Storage**: Vercel Blob Storage (encrypted files) + PostgreSQL (encrypted metadata/chunks)
- Files encrypted before upload; chunks encrypted before database storage
- Encryption keys never stored; derived on-demand from master key + organization ID

**Data Isolation:**
- Hard guarantee: Customer data never trains models (no training on customer data)
- No cross-tenant learning or data leakage
- Organization-scoped queries (all DB queries filtered by organizationId)
- Workspace-level isolation within organizations
- Document chunks encrypted with organization-specific keys

**Access Control:**
- RBAC: owner, admin, member, viewer roles
- Permission checks at API level (requireDocumentUploadPermission, etc.)
- Session-based authentication (NextAuth.js)
- Audit logs track all actions (document_upload, ai_query, user_access)

**Guardrails:**
- Pattern detection for sensitive data (credit cards, SSNs, emails)
- Content sanitization options (strict mode)
- Response validation before returning to user
- No script injection (XSS protection)

---

## What the AI Can Reliably Do Today

**Document Analysis:**
- Parse and chunk PDFs (text extraction via pdf-parse)
- Parse Excel files (multi-sheet support via XLSX)
- Parse CSV files
- Extract structured data from spreadsheets
- Smart text chunking for context injection

**AI Capabilities:**
- **Secure Mode (Ollama Cloud)**: 
  - Chat with documents (context-aware Q&A)
  - Document summarization
  - Data analysis queries
  - Models: gpt-oss:120b-cloud, qwen3-coder:480b-cloud, deepseek-v3.1:671b-cloud, llama3.3:70b-cloud, mistral-large:2406-cloud
  - No internet access (fully isolated)

- **Internet-Enabled Mode (OpenAI)**:
  - All secure mode capabilities PLUS
  - Web search integration (Serper API)
  - Real-time information retrieval
  - Models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-3.5-turbo
  - Function calling for web search

**Context Management:**
- Document context injection (up to 10 chunks per query, configurable)
- Workspace-scoped document access
- Document citation in responses
- Session-based conversation history

**Streaming:**
- Real-time streaming responses (SSE)
- Chunk-by-chunk delivery
- Usage tracking (token counts)

---

## What is Live vs. In Progress

### ✅ LIVE / PRODUCTION READY

**Core Platform:**
- User authentication (NextAuth.js)
- Organization & workspace management
- Multi-user RBAC
- Document upload (PDF, Excel, CSV)
- Document processing & chunking
- Encrypted file storage (Vercel Blob)
- AI chat with document context
- Streaming AI responses
- Audit logging
- Secure mode (Ollama Cloud)
- Internet-enabled mode (OpenAI + web search)

**Security:**
- AES-256-GCM encryption at rest
- Organization-scoped encryption keys
- RBAC enforcement
- Audit trail
- Guardrails (pattern detection)

**Document Processing:**
- PDF text extraction
- Excel multi-sheet parsing
- CSV parsing
- Smart chunking
- Encrypted chunk storage

### 🚧 IN PROGRESS / DISABLED

**QuickBooks Integration:**
- ❌ **DISABLED** - All QuickBooks functions throw errors
- Schema exists but client implementation disabled
- OAuth flow exists but not functional
- Marked as "read-only" in marketing but not implemented

**Advanced Features:**
- Semantic search / embeddings (schema supports it, not implemented)
- Vector search (embedding column exists but unused)
- Advanced document processing (images, tables extraction)
- Batch document processing queue (currently async but not queued)
- Document versioning
- Collaborative editing
- Advanced analytics/reporting

**AI Enhancements:**
- Anthropic Claude provider (code exists, not initialized)
- Gemini provider (code exists, not initialized)
- Custom fine-tuning
- Advanced prompt engineering UI
- Multi-document comparison

---

## Known Technical Constraints

**File Size Limits:**
- Maximum file size: 50MB per document
- No explicit chunk count limits (but context limited to ~10 chunks per query)

**Context Window:**
- Default: 10 document chunks per AI query (configurable via maxChunks)
- No explicit token limits enforced (relies on AI provider limits)
- Large documents may exceed context if not properly chunked

**AI Provider Constraints:**
- **Ollama Cloud**: Requires OLLAMA_API_KEY; rate limits unknown
- **OpenAI**: Requires OPENAI_API_KEY; subject to OpenAI rate limits (429 errors handled)
- **Web Search**: Requires SERPER_API_KEY; subject to Serper API quotas

**Database:**
- PostgreSQL required (Drizzle ORM)
- No explicit connection pooling configuration visible
- Batch inserts limited to 100 chunks at a time

**Encryption:**
- Master encryption key must be set (ENCRYPTION_KEY env var)
- Key derivation is CPU-intensive (100k PBKDF2 iterations) - may impact performance at scale
- No key rotation mechanism visible

**Storage:**
- Vercel Blob Storage required (BLOB_READ_WRITE_TOKEN)
- No alternative storage backends supported
- Files are public URLs (but encrypted) - access control via encryption keys

**Performance:**
- Document processing is async but not queued (may fail silently)
- No retry mechanism for failed processing
- No caching layer for document chunks
- Sequential chunk decryption (could be parallelized)

**Multi-Tenancy:**
- Organization isolation enforced at application level (not database level)
- Single database instance (no sharding)
- All organizations share same encryption master key (differentiated by org ID)

---

## Anything I Should Avoid Overselling

**❌ DO NOT CLAIM:**

1. **"HIPAA Compliant"** - While architecture is medical-grade, no explicit HIPAA compliance certification mentioned. Use "medical-grade security foundation" instead.

2. **"Fully Offline"** - Secure mode uses Ollama Cloud (still requires internet for API calls, just no web search). Not truly air-gapped.

3. **"Real-Time Collaboration"** - No collaborative editing features; workspaces are shared but no live editing.

4. **"Unlimited Documents"** - 50MB file size limit exists; no explicit document count limits but storage costs apply.

5. **"Vector Search"** - Schema supports embeddings but feature not implemented. Don't claim semantic/vector search capabilities.

6. **"QuickBooks Integration"** - Currently disabled. Don't promise QuickBooks connectivity even though it's mentioned in marketing materials.

7. **"Zero-Knowledge"** - Encryption keys are server-side (derived from master key). Not true zero-knowledge architecture.

8. **"Instant Processing"** - Document processing is async and may take time for large files. No SLA on processing time.

9. **"100% Uptime"** - Depends on Vercel, OpenAI, Ollama Cloud, Serper API availability. No redundancy mentioned.

10. **"Enterprise SSO"** - Only NextAuth.js email/password auth visible. No SAML/OAuth enterprise SSO mentioned.

**✅ SAFE TO CLAIM:**

- Medical-grade security foundation (architecture rigor)
- End-to-end encryption (AES-256-GCM)
- Organization-isolated workspaces
- No training on customer data (hard guarantee)
- Role-based access control
- Full audit logging
- Secure AI chat with document context
- Dual-mode AI (Secure vs Core)
- Document analysis (PDF, Excel, CSV)
- Streaming responses
- Policy-aware guardrails

---

## Additional Technical Notes

**Deployment:**
- Designed for Vercel (serverless functions)
- Also supports GCP Cloud Run (standalone output mode)
- Environment variables required: ENCRYPTION_KEY, BLOB_READ_WRITE_TOKEN, OLLAMA_API_KEY, OPENAI_API_KEY (optional), SERPER_API_KEY (optional)

**Monitoring:**
- Console logging for debugging
- No explicit APM/monitoring integration visible
- Error handling via handleError utility

**Scalability:**
- Serverless architecture (auto-scaling)
- No explicit horizontal scaling configuration
- Database connection pooling not visible
- No CDN configuration for static assets

**Backup/Recovery:**
- No explicit backup strategy visible
- Database migrations via Drizzle
- No disaster recovery plan documented
