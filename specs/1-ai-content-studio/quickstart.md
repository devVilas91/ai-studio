# Quickstart: AI Content Studio

**Feature**: 1-ai-content-studio  
**Date**: 2026-03-04

This guide helps you set up a local development environment for the AI Content Studio and deploy to Vercel with Supabase.

---

## Prerequisites

- Node.js 20+ (LTS)
- Git
- Supabase account (free tier works)
- Vercel account (for deployment)
- Google OAuth credentials (from Google Cloud Console)

---

## 1. Clone and Install

```bash
git clone <your-repo-url>
cd <repo>
npm install
```

---

## 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon/public key**.
3. In the Supabase dashboard, go to **Database** and create the tables using the Prisma schema (see next step).
4. Enable **Realtime** for the tables you want to subscribe to (e.g., `Asset`, `WorkflowExecution`).

---

## 3. Configure Prisma

Create `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].db.supabase.co:5432/postgres?pgbouncer=true"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Supabase (optional for storage)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

Initialize Prisma and generate client:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This creates the database tables and `prisma/client`.

---

## 4. Configure Tailwind CSS v4 & HeroUI v3

Install dependencies:

```bash
npm i @heroui/styles@beta @heroui/react@beta tailwind-variants
npm i -D tailwindcss @tailwindcss/postcss postcss
```

Create `postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Update `app/globals.css`:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

---

## 5. Configure NextAuth.js

Create `app/api/auth/[...nextauth]/route.ts` as described in the research report. Ensure the `auth` export is used in `middleware.ts`.

---

## 6. Set Up WebSocket Server (Optional for MVP)

For local development, you can run the WebSocket server separately:

```bash
npm i ws redis
```

Create `ws-server.ts` in the root (see research report for example). Run it:

```bash
npx tsx ws-server.ts
```

Update client to connect to `ws://localhost:8080`.

For production, deploy the WS server to a service like Railway or Render. Set `WS_SERVER_URL` environment variable.

---

## 7. Configure i18n

Install `next-intl`:

```bash
npm i next-intl
```

Create `messages/en.json` and `messages/es.json` with basic translations.

Add i18n configuration in `i18n.ts` and middleware.

---

## 8. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the login page.

---

## 9. Test the Flow

1. Click "Sign in with Google" and complete OAuth.
2. Create a new project.
3. Create a workflow with steps: Blog → Image → Video.
4. Execute the workflow and observe real-time status updates.
5. Upload assets to the project.
6. Invite a team member (use another Google account) and test real-time collaboration.

---

## 10. Deploy to Vercel

1. Push your code to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your Vercel domain)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `WS_SERVER_URL` (if using separate WS server)
4. Deploy.
5. In Supabase, add your Vercel domain to **Authentication > Redirect URLs** and **URL Configuration**.

---

## 11. Database Migrations in Production

For production, use Prisma migrate deploy:

```bash
npx prisma migrate deploy
```

Add this as a Vercel build step or run manually after first deploy.

---

## 12. Monitoring & Alerts

- Enable Vercel Analytics for performance.
- Set up Supabase alerts for database errors.
- Consider Sentry for error tracking: `npm i @sentry/nextjs`.

---

## Troubleshooting

**Prisma client not generated**: Run `npx prisma generate`.

**NextAuth not working**: Check `NEXTAUTH_SECRET` is set and consistent. Verify Google OAuth credentials and redirect URIs.

**WebSocket connection fails**: Ensure WS server is running and accessible. Check CORS and authentication.

**HeroUI components not styled**: Verify `globals.css` imports Tailwind before HeroUI styles. Ensure Tailwind v4 is installed.

**Supabase connection error**: Check `DATABASE_URL` format and that connection pooling is enabled (`pgbouncer=true`). Ensure Supabase project is active.

---

## Project Structure Reference

See `plan.md` for full project structure.

---

## Next Steps

After MVP, consider:
- Adding more agent types (audio, translation)
- Implementing BullMQ for robust queueing
- Adding CRDT-based collaboration
- Implementing advanced workflow features (conditionals, loops)
- Adding user documentation and onboarding

---

**Happy Building!**
