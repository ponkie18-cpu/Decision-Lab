# Dinaledi360 - Decision-Intelligence for Entrepreneurs

Dinaledi360 helps learners and entrepreneurs make business decisions, see the consequences, and produce evidence of business readiness through immersive simulations and AI-driven forensic feedback.

---

## Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion, React Markdown, Recharts.
* **Backend & Persistence:** Firebase (Firestore & Anonymous/Email Authentication).
* **AI Engine:** Google Gemini AI API (`gemini-3.8-flash`) via server-side Firebase HTTPS Callable proxy (`simulateRoundProxy`).

---

## Environment Variables

Configure the following variables in `.env` (or via Cloud Run / Firebase environment secrets):

```env
# Required for Gemini AI API calls (Server-side secret)
GEMINI_API_KEY="your_gemini_api_key_here"

# Application URL
APP_URL="http://localhost:3000"
```

---

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Run Development Server

```bash
bun run dev
```

The app will be available at `http://localhost:3000`.

### 3. Build & Preview

```bash
bun run build
bun run preview
```

### 4. Type Checking & Verification

```bash
bun run lint
```

### 5. Running Unit Tests

```bash
bun run test
```

Unit tests cover payload domain validation, prompt hygiene, and deterministic simulation fallback execution using `vitest`.
