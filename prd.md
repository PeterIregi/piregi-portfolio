# Product Requirements Document
## Modern Professional Portfolio Website with Admin Dashboard & CMS

**Version:** 1.0
**Status:** Draft
**Owner:** [Your Name]
**Last Updated:** September 22, 2026

---

## 1. Overview

A personal/professional portfolio website that presents work, experience, and credentials to visitors (recruiters, clients, collaborators) in a clean, modern, and credible way. The site is powered by a custom CMS and admin dashboard so the owner can update content, projects, and their CV without touching code, plus a dedicated section for visitors to view and download the current CV/resume.

### 1.1 Problem Statement
Static portfolio sites require a developer to update every time a project, skill, or job changes. The owner needs a self-service way to manage content, and visitors need a fast, professional way to learn about the owner and grab an up-to-date CV.

### 1.2 Goals
- Present a polished, modern-but-professional personal brand online.
- Let the owner manage all content (bio, projects, skills, experience, testimonials, blog/articles) via an admin dashboard — no code changes needed.
- Provide a reliable, always-current CV: owner uploads new versions; visitors view/download the latest one.
- Fast load times and strong SEO so the site is discoverable.
- Mobile-responsive and accessible.

### 1.3 Non-Goals
- Not a multi-tenant SaaS product (single owner/admin initially).
- Not an e-commerce or payments platform.
- Not a full blogging platform with comments/social features (a simple articles section is enough, if included).

---

## 2. Target Users & Personas

| Persona | Description | Needs |
|---|---|---|
| **Site Owner (Admin)** | The portfolio's subject — freelancer, job-seeker, consultant | Easy way to add/edit projects, update bio, upload new CV, see analytics |
| **Recruiter / Hiring Manager** | Visits to evaluate candidacy | Quick overview of skills/experience, downloadable CV, contact method |
| **Client / Collaborator** | Visits to evaluate for hire/partnership | Case studies, testimonials, contact form |
| **General Visitor** | Peers, network contacts | Browsing projects, reading about the owner |

---

## 3. Scope

### 3.1 In Scope
- Public-facing portfolio website (multi-section, responsive)
- CV upload (admin) and download (public) feature with version history
- Admin dashboard with authentication
- Custom CMS for managing all dynamic content
- Contact form with notifications
- Basic analytics (page views, CV downloads, contact submissions)

### 3.2 Out of Scope (v1)
- Multi-user/team collaboration in the CMS
- E-commerce/payment integration
- Native mobile app
- Multi-language support (may be a v2 consideration)

---

## 4. Feature Requirements

### 4.1 Public Website

| Feature | Description | Priority |
|---|---|---|
| Hero/Landing section | Name, title/tagline, short intro, CTA buttons (View Work, Download CV, Contact) | Must |
| About page/section | Bio, photo, skills, values | Must |
| Projects/Portfolio gallery | Grid/list of projects with filters (by tag/category), each with detail page (images, description, tech stack, links) | Must |
| Experience/Timeline | Work history, education, certifications | Must |
| Skills section | Categorized skills, optionally with proficiency indicators | Should |
| Testimonials | Rotating/list of client or colleague quotes | Should |
| CV Download section | Prominent button to view/download the current CV (PDF); shows last-updated date | Must |
| Blog/Articles (optional) | List + detail pages for articles | Could |
| Contact form | Name, email, message, spam protection (e.g., CAPTCHA), sends email notification to owner | Must |
| Social/external links | LinkedIn, GitHub, email, etc. | Must |
| SEO metadata | Per-page titles, descriptions, Open Graph tags, sitemap.xml, robots.txt | Must |
| Dark/light mode | Theme toggle | Could |

### 4.2 Admin Dashboard

| Feature | Description | Priority |
|---|---|---|
| Secure login | Email/password auth (with option for OAuth/SSO), session management, password reset | Must |
| Dashboard home | Overview: recent contact submissions, CV download count, site visits | Should |
| Content management | CRUD for Projects, Experience entries, Skills, Testimonials, About/Bio content | Must |
| CV management | Upload new CV (PDF), set as "active/live," view version history, delete old versions | Must |
| Media library | Upload/manage images used across projects and bio | Must |
| Contact submissions inbox | View, mark read/unread, archive, reply-via-email link | Must |
| Site settings | Update meta info, social links, theme/branding settings | Should |
| Blog/article editor (if in scope) | Rich text/Markdown editor, draft/publish states | Could |
| Activity log | Track changes/edits for accountability | Could |

### 4.3 CV Upload & Download Feature (Detail)

**Admin side:**
- Upload a new CV file (PDF only, max size e.g. 10MB).
- System validates file type/size before accepting.
- Newly uploaded CV becomes the "active" version shown publicly; previous versions are retained in a version history (with upload date).
- Admin can revert to a previous version or delete old ones.
- Admin can see a count of how many times the CV has been downloaded.

**Public side:**
- Visitors see a "Download CV" / "View Resume" button (persistent in nav/header and on About section).
- Clicking opens the CV in-browser (PDF viewer) and/or triggers a direct download.
- Download timestamp and count are logged for analytics (no PII collected on the visitor beyond aggregate counts, unless a "request access" gate is later added).

---

## 5. Information Architecture (Sitemap)

```
/                     Home (Hero + featured projects + summary)
/about                About / Bio
/projects             Projects listing
/projects/:slug       Project detail
/experience           Experience & education timeline
/cv                   CV view/download page
/blog                 Articles listing (optional)
/blog/:slug           Article detail (optional)
/contact              Contact form

/admin/login          Admin login
/admin                Dashboard home
/admin/projects       Manage projects
/admin/experience     Manage experience
/admin/skills         Manage skills
/admin/testimonials   Manage testimonials
/admin/cv             Manage CV uploads
/admin/media          Media library
/admin/messages       Contact submissions
/admin/settings       Site settings
```

---

## 6. Data Model (High-Level)

- **User (Admin)**: id, email, password_hash, name, role, last_login
- **Project**: id, title, slug, summary, description, cover_image, gallery[], tech_stack[], tags[], project_url, repo_url, status (draft/published), created_at, updated_at
- **Experience**: id, role_title, organization, start_date, end_date, description, type (work/education/certification)
- **Skill**: id, name, category, proficiency (optional)
- **Testimonial**: id, author_name, author_title, company, quote, avatar
- **CVFile**: id, file_url, original_filename, uploaded_at, is_active (bool), download_count
- **ContactSubmission**: id, name, email, message, submitted_at, status (new/read/archived)
- **MediaAsset**: id, url, alt_text, uploaded_at, used_in (references)
- **SiteSettings**: key-value store for meta info, socials, theme

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Page load < 2s on 4G; Lighthouse score 90+ on Performance, Accessibility, SEO |
| Security | HTTPS everywhere; hashed/salted passwords; rate-limited login attempts; file-type/size validation on uploads; CSRF/XSS protection; admin routes protected by auth middleware |
| Accessibility | WCAG 2.1 AA compliance (alt text, keyboard nav, contrast ratios) |
| Responsiveness | Fully responsive across mobile, tablet, desktop breakpoints |
| Reliability | 99.5%+ uptime; automated backups of database and uploaded files |
| Scalability | Should handle moderate traffic spikes (e.g., after sharing on LinkedIn) without degradation |
| SEO | Server-side rendering or static generation for public pages; structured data (schema.org Person/CreativeWork) |
| Browser support | Latest 2 versions of Chrome, Firefox, Safari, Edge |

---

## 8. Suggested Tech Stack (Reference Only)

| Layer | Option |
|---|---|
| Frontend | Next.js (React) or similar SSR/SSG framework, Tailwind CSS |
| Backend/CMS | Custom Node.js/Express API, or headless CMS (e.g., Strapi, Sanity) adapted for this use case |
| Database | PostgreSQL or MongoDB |
| File storage | S3-compatible object storage (for CV PDFs and images) |
| Auth | JWT-based session or NextAuth with credentials provider |
| Hosting | Vercel/Netlify (frontend) + managed DB/storage (e.g., Supabase, Render, AWS) |
| Email notifications | Resend, SendGrid, or similar for contact form + upload alerts |
| Analytics | Plausible, Umami, or Google Analytics (privacy-conscious preferred) |

*(This is a suggested stack; final choice depends on the owner's technical preference and budget.)*

---

## 9. Success Metrics

- CV download count trending upward month over month
- Contact form submission rate (visitors → inquiries)
- Average session duration and bounce rate improvement vs. baseline
- Time-to-publish for a new project (owner should be able to add a project in under 10 minutes via CMS)
- Lighthouse performance/accessibility/SEO scores ≥ 90

---

## 10. Milestones (Suggested Phased Rollout)

| Phase | Deliverables | Est. Duration |
|---|---|---|
| Phase 1: Foundation | IA finalized, design system/UI kit, tech stack setup, auth scaffolding | 1–2 weeks |
| Phase 2: Public Site | Home, About, Projects, Experience, Contact pages built with static/sample data | 2–3 weeks |
| Phase 3: CMS & Admin Dashboard | Admin auth, CRUD for all content types, media library | 2–3 weeks |
| Phase 4: CV Feature | Upload/version history, public download/view page, analytics counter | 3–5 days |
| Phase 5: Polish & Launch | SEO pass, accessibility audit, performance tuning, analytics integration, QA | 1–2 weeks |

---

## 11. Risks & Assumptions

- **Assumption:** Single admin user for v1; no multi-role permission system needed yet.
- **Risk:** Scope creep from adding blog/multi-language features mid-build — mitigate by locking v1 scope per section 3.
- **Risk:** Large media/CV uploads could increase storage costs — mitigate with file size limits and image optimization.
- **Assumption:** Owner will provide initial content (bio, project write-ups, CV) before Phase 2 starts.

---

## 12. Open Questions

1. Should the CV download require an email capture (lead gen) or remain fully open?
2. Is a blog/articles section needed in v1, or can it be deferred to v2?
3. Should there be a "light" public-facing analytics widget (e.g., "X people viewed this project") or keep analytics admin-only?
4. Any brand guidelines (colors, fonts, logo) already defined, or should the design system be created from scratch?