# NetScope Privacy Architecture & Data Governance

## 1. Core Privacy Commitments

NetScope is architected around principles of **Data Minimization**, **Local-First Storage**, and **Zero Unnecessary Profiling**.

---

## 2. Privacy Pillars

### 1. No Mandatory User Accounts
Users can test internet connections indefinitely without creating accounts, providing email addresses, phone numbers, or passwords.

### 2. Ephemeral Upload Payload Discard
- Client-generated binary chunks sent during upload tests are consumed asynchronously by the FastAPI backend directly in RAM.
- Byte lengths and transmission timestamps are counted.
- Chunks are discarded immediately from memory upon reading.
- Upload data is **never** written to persistent disk storage, PostgreSQL tables, or log files.

### 3. IP Address Anonymization
- To group historical performance for baseline degradation without tracking user identity, client IP addresses are hashed using SHA-256 with a unique application salt:
  $$\text{Client Hash} = \text{SHA-256}(\text{Salt} + \text{Client IP})[:16]$$
- Raw IP addresses are never saved to the database.

### 4. Local-First Client Vault (IndexedDB)
- All measurement history, telemetry samples, and personal records reside directly inside the user's browser storage (IndexedDB).
- Complete export available in JSON and CSV formats.
- Instant 1-click "Clear All Data" erases all stored history.

### 5. Zero Third-Party Tracking
- No Google Analytics, advertising pixels, session replays, or browser fingerprinting scripts are loaded.
