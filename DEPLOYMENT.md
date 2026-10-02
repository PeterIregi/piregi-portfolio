# Production Deployment Guide

## Prerequisites

- Vercel account (vercel.com)
- Supabase production project (separate from dev)
- Resend account for emails (resend.com)
- GitHub repository connected to Vercel

---

## 1. Create Supabase Production Project

1. Go to supabase.com → New Project
2. Name: `portfolio-prod` (or similar)
3. **Different region** from dev if possible
3. Save the **Database password** securely
4. Wait for project to be ready

### Configure Supabase Production

**Database:**
- Settings → Database → Connection string → URI
- Copy `DATABASE_URL` (replace `[YOUR-PASSWORD]` with actual password)

**API Keys:**
- Settings → API → Project URL → `SUPABASE_URL`
- Settings → API → service_role (secret) → `SUPABASE_SERVICE_ROLE_KEY`

**Storage Buckets:**
- Storage → New bucket: `cv-images` (Public: ON)
- New bucket: `cv-files` (Public: OFF)

---

## 2. Configure Resend (Emails)

1. Go to resend.com → API Keys → Create API Key
2. Domain verification (optional but recommended):
   - Add your domain in Resend
   - Add DNS records as instructed
3. Copy API Key → `RESEND_API_KEY`

---

## 3. Configure Vercel

1. Go to vercel.com → Add New Project → Import from GitHub
2. Select `PeterIregi/piregi-portfolio`
3. **Environment Variables** (add all):

| Variable | Value | Scope |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Production |
| `SUPABASE_URL` | `https://...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production |
| `AUTH_SECRET` | (32-char random) | Production |
| `RESEND_API_KEY` | `re_...` | Production |
| `CONTACT_NOTIFY_EMAIL` | `your@email.com` | Production |
| `NEXT_TELEMETRY_DISABLED` | `1` | Production |

4. **Deploy** → Wait for first deployment

---

## 4. Run Production Migrations

After first deploy, run migrations against production DB:

```bash
# Locally with production DATABASE_URL
DATABASE_URL="postgresql://..." pnpm db:migrate
```

Or use Supabase CLI:
```bash
supabase db push --db-url "postgresql://..."
```

---

## 5. Verify Production

| Check | URL |
|-------|-----|
| Homepage | `https://your-domain.vercel.app` |
| Admin login | `https://your-domain.vercel.app/admin/login` |
| CV download | `https://your-domain.vercel.app/cv` |
| Contact form | `https://your-domain.vercel.app/contact` |
| Sitemap | `https://your-domain.vercel.app/sitemap.xml` |
| Robots | `https://your-domain.vercel.app/robots.txt` |

**Admin credentials (from seed):**
- Email: `admin@piregi.dev`
- Password: `changeme123` → **Change immediately in admin settings**

---

## 6. Custom Domain (Optional)

1. Vercel → Project → Settings → Domains
2. Add your domain
3. Add DNS records as instructed
4. Wait for SSL certificate

---

## 7. GitHub Secrets for CI/CD

Repository → Settings → Secrets → Actions → New repository secret:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | From Vercel Account → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Organization ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → Project ID |
| `AUTH_SECRET` | Same as production |
| `DATABASE_URL` | Production DATABASE_URL |
| `SUPABASE_URL` | Production SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service_role key |
| `RESEND_API_KEY` | Production RESEND_API_KEY |
| `CONTACT_NOTIFY_EMAIL` | Production email |

---

## 7. Enable Auto-Deploy

The `.github/workflows/deploy.yml` handles this automatically on push to `main`.

---

## Rollback

Vercel → Deployments → Click "..." on previous deployment → "Promote to Production"

---

## Monitoring

- **Vercel Analytics** (enable in project settings)
- **Supabase Logs** (Dashboard → Logs)
- **Resend Logs** (resend.com → Logs)

---

## Security Checklist

- [ ] `AUTH_SECRET` is unique, 32+ chars
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server env (never client)
- [ ] `RESEND_API_KEY` restricted to sending domain
- [ ] Admin password changed from default
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] CSP headers considered (add to `next.config.ts` if needed)