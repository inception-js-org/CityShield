# HackDeck – Full Setup & Run Commands (Command-Only)

## 1️⃣ Clone & Enter Project

```bash
git clone <your-repo-url>
cd HackDeck
```

## 2️⃣ Backend – Python Environment

```bash
conda create -n hackEnv
conda activate hackEnv
```

## 3️⃣ Install Python Dependencies

```bash
pip install fastapi uvicorn prisma pydantic pydantic-settings httpx python-dotenv "pydantic[email]"
```

## 4️⃣ Install Node & Prisma CLI

```bash
npm install
npm install prisma --save-dev
```

## 5️⃣ Environment Variables

```bash
copy .env.example .env
```

```bash
set DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
set CLERK_SECRET_KEY=sk_test_xxxxxxxxx
set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx
```

## 6️⃣ Prisma Setup

```bash
npx prisma generate
```

```bash
npx prisma migrate dev
```

If version mismatch happens:

```bash
npx prisma@5.8.0 generate
```

## 7️⃣ Run Backend Server

```bash
python -m uvicorn app:app --reload
```

## 8️⃣ Verify Backend

```bash
curl http://localhost:8000/health
```

## 9️⃣ Install & Authenticate ngrok

```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

## 🔟 Start ngrok Tunnel

```bash
ngrok http 8000
```

Copy the HTTPS forwarding URL shown.

## 1️⃣1️⃣ Clerk Webhook URL (USE EXACTLY)

```bash
https://<ngrok-id>.ngrok-free.app/api/officers/webhooks/clerk
```

❌ Do NOT use:

```bash
/api/officers/webhooks/clerki
```

## 1️⃣2️⃣ Restart Backend (After Webhook Added)

```bash
taskkill /F /IM python.exe
python -m uvicorn app:app --reload
```

## 1️⃣3️⃣ Invite Officer (API Test)

```bash
curl -X POST http://localhost:8000/api/officers/invite ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"officer@example.com\",\"name\":\"Officer Name\"}"
```

## 1️⃣7️⃣ Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## 1️⃣9️⃣ Common Reset Commands

```bash
taskkill /F /IM python.exe
taskkill /F /IM prisma-query-engine-windows.exe
taskkill /F /IM ngrok.exe
```

## 2️⃣0️⃣ Re-run Everything (Quick)

```bash
hackEnv\Scripts\activate
python -m uvicorn app:app --reload
ngrok http 8000
```
