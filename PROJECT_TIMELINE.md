# Nkabom — Complete Product Delivery Timeline

**Planning baseline:** 14 August 2026  
**Target:** a production-ready, Ghana-first marketplace for customer-selected bespoke craft commissions  
**Planning horizon:** approximately 52 weeks to a controlled public launch, followed by a 12-week stabilization period  
**Status language:** `Complete`, `In progress`, `Planned`, or `Blocked by decision` only

> This is a delivery plan, not a promise that calendar time alone makes a feature complete. A phase exits only when its evidence gate passes. If a dependency takes longer, the dates move; the gate does not.

## 1. Product outcome

Nkabom will let a customer discover verified Ghanaian makers, choose a maker, create a private commission request, agree on a quote, pay through the platform, follow the work to completion, and resolve problems against one accountable record.

The first production release must preserve these rules:

- every new account begins as a Buyer;
- Seller access is an approved capability on the same accountable identity, not a second account;
- Administrator authority is assigned only by a protected server-side process;
- the customer selects the maker;
- private requests, measurements, messages, and identity evidence never become public marketplace content;
- platform transaction records are canonical and auditable;
- payment protection, verification, escrow, delivery, and security claims appear only when the underlying service is real;
- Redis may improve caching and multi-instance coordination, but correctness must never depend on Redis;
- realtime browser updates use SSE where useful, with ordinary HTTP for commands and database state as the source of truth.

## 2. Planning assumptions

This schedule assumes a small team with at least one full-time engineer, regular design support, and access to product/operations decisions. With one part-time engineer, expect the schedule to extend. Payment, identity, legal, and delivery-provider approval are external critical-path items and may change the launch date.

Relative weeks are authoritative; the dates are a working calendar starting Monday, 17 August 2026.

| Milestone | Working date | Outcome |
|---|---:|---|
| Foundation consolidated | 11 Sep 2026 | Existing auth, Seller application, and Admin work is stable and documented |
| Verified Seller foundation | 30 Oct 2026 | Approved Sellers can manage a private profile and publish only after review |
| Public marketplace beta | 18 Dec 2026 | Guests can discover real approved makers and work |
| Commission workflow beta | 19 Mar 2027 | Request, conversation, quote, and order lifecycle works without payments |
| Payment sandbox complete | 14 May 2027 | Payment, ledger, refund, payout, and reconciliation failure paths pass |
| Operational release candidate | 25 Jun 2027 | Fulfilment, disputes, reviews, support, and admin operations work |
| Controlled production launch | 27 Aug 2027 | Pilot users complete real transactions with monitored support |
| Initial product complete | 19 Nov 2027 | Twelve-week stabilization gate passes with no unresolved critical issue |

## 3. Current verified baseline

The repository already contains meaningful product foundations. These are not future timeline items unless a validation gate finds a defect.

### Complete or substantially implemented

- React, Vite, Tailwind CSS, shadcn-style component foundation, themes, and responsive public header.
- AdonisJS API and Neon PostgreSQL development database integration.
- Buyer-by-default registration.
- Email verification, sign-in, session profile, logout, forgotten-password, and reset-password flows.
- Mailpit development email capture.
- Seller application draft, save, validation, submission, and status flow.
- Administrator authorization middleware.
- Responsive Administrator shell with an overview route.
- Seller-application operations queue and detail route.
- Individual and bulk Seller-application review actions.
- Review audit fields, self-review prevention, and idempotent review behavior.
- Role-gated entry from the main application into the Administrator workspace.
- Reusable page screenshot script and design-agent instructions.

### In progress at timeline start

- Consolidating the current uncommitted Auth, Seller application, Admin, dropdown, select, toast, and layout changes.
- Proving the full current browser flows against clean database state.
- Replacing remaining demonstration language or decorative controls with truthful product states.

### Not yet a complete product domain

- Seller profile, private identity evidence, portfolio, availability, and published storefront.
- Real marketplace catalogue, search, filters, saved items, and public detail pages.
- Custom request, messaging, quote, order, fulfilment, payment, payout, dispute, review, and support domains.
- Production email, object storage, monitoring, hosting, compliance decisions, and operational staffing.

## 4. Delivery method used in every phase

Every feature slice follows the same sequence:

1. **Decide:** define the user problem, owner, privacy class, state machine, failure cases, and truthful product language.
2. **Design:** create desktop, tablet, and mobile states for success, empty, loading, error, permission denial, offline, and retry.
3. **Contract:** define strict request/response types and stable error codes before wiring UI to data.
4. **Persist:** add backward-compatible migrations, constraints, indexes, and integrity checks.
5. **Implement:** use domain services for transactional rules and server-side authorization for every capability.
6. **Connect:** replace fixtures with real API state; keep demo data explicitly marked and development-only.
7. **Prove:** run unit, integration, browser, responsive, accessibility, security, and failure-path checks appropriate to the slice.
8. **Operate:** add structured logs, audit events, support visibility, documentation, and recovery instructions.

Security and reliability are implemented during every phase, not postponed to a final hardening sprint.

## 5. Phase timeline

### Phase 0 — Baseline consolidation and decision register

**Weeks 1–4 · 17 Aug–11 Sep 2026**

**Purpose:** turn the current foundation into a clean, repeatable baseline before adding domains.

Deliverables:

- review and preserve current user/design changes, then create a coherent repository commit;
- document local setup for frontend, backend, Neon, and Mailpit;
- add or finish CI for install, formatting, lint, strict typecheck, tests, and production builds;
- establish environment validation and keep all secrets out of source control;
- prove Auth and Seller-application flows from a clean database;
- verify Administrator provisioning cannot be performed by a public client;
- normalize error envelopes, request IDs, health/readiness checks, and structured logging;
- record owners and deadlines for identity, payment, tax, delivery, cancellation, support, and data-retention decisions;
- label incomplete routes and actions honestly or remove them from navigation;
- establish a browser and responsive QA matrix for 360 px mobile through wide desktop.

Exit gate:

- clean installation succeeds from documented steps;
- backend and frontend checks pass;
- register → verify → sign in → apply as Seller → Admin review → Seller access passes in a real browser;
- migration rollback/reapply is proven in development;
- repository contains no secret, private evidence, runtime upload, or production claim without evidence.

### Phase 1 — Seller identity, profile, and verification

**Weeks 5–11 · 14 Sep–30 Oct 2026**

**Purpose:** turn an approved Seller capability into a controlled maker identity.

Frontend:

- Seller workspace shell and responsive navigation;
- Seller profile editor: trading name, biography, location, languages, primary craft, specialties, lead time, capacity, and availability;
- verification status, correction request, resubmission, approval, restriction, and appeal states;
- private identity-evidence upload with progress, retry, replacement, and deletion-policy disclosure;
- portfolio manager with ordering, captions, alt text, ownership confirmation, draft/published state, and media limits;
- storefront preview that distinguishes private draft from public output.

Backend/data:

- Seller profile, verification submission, evidence metadata, portfolio item, media, availability, and storefront-version tables;
- encrypted/private object storage separated from public portfolio media;
- file signature/type/size validation, expiring private access, and malware-scanning integration point;
- explicit profile, verification, storefront, and availability state machines;
- Admin review queues, correction requests, restriction/restoration, reason capture, notifications, and immutable audit;
- publication query that permits only approved, active, complete Sellers.

Exit gate:

- an approved Seller can build a profile and submit evidence;
- an unverified, restricted, incomplete, or paused Seller cannot appear publicly;
- public URLs cannot retrieve identity evidence or private uploads;
- review/resubmission, stale update, duplicate upload, authorization, and mobile browser tests pass.

### Phase 2 — Public marketplace and discovery

**Weeks 12–18 · 2 Nov–18 Dec 2026**

**Purpose:** make real, approved maker work discoverable without exposing private state.

Frontend:

- marketplace home with useful category and location entry points;
- Makers directory, Work directory, maker storefront, and work-detail pages;
- compact global search dropdown with grouped results and a full results route;
- craft, specialty, region, availability, and relevant price/lead-time filters;
- URL-backed filters, pagination, deep links, empty/error/loading states, and responsive images;
- About, How it works, Trust and safety, Help, Contact, Terms, Privacy, Seller standards, and prohibited-content pages;
- truthful calls to action: no Buy, Verified, Protected, or Nationwide Delivery claim unless its domain is active.

Backend/data:

- public read models and permission-safe queries for Sellers, portfolio work, and listings;
- indexed PostgreSQL search with normalized searchable text and deterministic ranking;
- keyset pagination and bounded response sizes;
- moderation visibility separate from Seller publication state;
- lawful, clearly identified development fixtures with owned/licensed media;
- cache headers for safe public reads; Redis remains optional.

Exit gate:

- every public route is usable with real seeded records on mobile, tablet, and desktop;
- unapproved, paused, restricted, deleted, or private data cannot leak through search or direct IDs;
- search, filters, pagination, deep links, keyboard use, screen-reader labels, and performance budgets pass.

### Phase 3 — Buyer account foundation and saved work

**Weeks 19–21 · 4–22 Jan 2027**

**Purpose:** give Buyers a useful private workspace before transaction creation.

Deliverables:

- Buyer overview with recent activity and route-backed empty states;
- saved makers and saved work, using one accessible heart action and private persisted state;
- profile, contact, region/locality, notification, session, and security settings;
- destination-preserving authentication when a Guest tries a protected action;
- idempotent Save/Unsave endpoints and unavailable-target opacity;
- account restriction and session revocation handling across open tabs.

Exit gate:

- Guest, Buyer, Seller, and Administrator capability tests pass;
- Save is private, idempotent, and cannot reveal unavailable targets;
- authentication returns users to their intended safe route.

### Phase 4 — Custom commission requests

**Weeks 22–26 · 25 Jan–26 Feb 2027**

**Purpose:** let a Buyer deliberately request work from one selected maker.

Frontend:

- request composer launched from a chosen maker or work item;
- craft-specific structured brief, budget range, desired date, location, measurements, notes, and private references;
- autosaved draft, review-before-submit, edit/cancel rules, upload progress, and recovery after connection loss;
- Buyer request list/detail and Seller incoming-request queue/detail;
- explicit states for draft, submitted, viewed, clarification needed, declined, withdrawn, expired, and ready for quote.

Backend/data:

- request, participant, source attribution, private attachment, state-event, and idempotency records;
- ownership/participation authorization and private object storage;
- optimistic versioning, atomic state changes, and immutable source/selected-maker snapshot;
- bounded attachment rules and retention/deletion behavior;
- email/in-app notifications with preferences.

Exit gate:

- retries cannot create duplicate requests or attachments;
- the selected maker cannot be silently replaced;
- nonparticipants cannot enumerate or access requests;
- draft recovery, duplicate submit, stale update, offline retry, and narrow-screen tests pass.

### Phase 5 — Messaging and realtime notifications

**Weeks 27–30 · 1–26 Mar 2027**

**Purpose:** support private clarification and operational updates without polling.

Deliverables:

- one request/order-scoped conversation shared by the real participants;
- messages, private attachments, read cursors, unread counts, pagination, and retry-safe sending;
- SSE connection with authentication, reconnection, last-event recovery, and permission revalidation;
- TanStack Query (or the selected client cache) updated from canonical SSE events;
- in-app notification centre plus transactional email for important events;
- optional Redis Pub/Sub transport for multiple backend instances, with a working database/direct-process fallback;
- event naming/versioning, backpressure limits, connection metrics, and graceful shutdown.

Exit gate:

- no `setInterval` polling is used for realtime state;
- duplicate, reordered, missed, and reconnected events converge on canonical API state;
- message contents are not placed in logs or exposed to nonparticipants;
- the system remains correct with Redis disabled.

### Phase 6 — Quotes and canonical commission orders

**Weeks 31–34 · 29 Mar–23 Apr 2027**

**Purpose:** convert an agreed scope into a stable commercial record.

Frontend:

- structured Seller quote with line items, labour/material split where appropriate, delivery/collection terms, completion estimate, validity, revision, and notes;
- Buyer comparison of quote revisions and explicit accept/decline actions;
- shared commission detail showing accepted snapshot, participants, activity timeline, and next action;
- clear `Payment not configured` state until the payment phase passes.

Backend/data:

- quote, quote version, line item, expiry, response, order, and order-event records;
- atomic, idempotent quote acceptance and exactly-once order creation;
- immutable accepted commercial snapshot;
- explicit request, quote, order, and payment states kept separate;
- Administrator exception visibility and audited intervention boundaries.

Exit gate:

- stale, expired, declined, superseded, and duplicate acceptance paths are safe;
- accepted terms cannot be silently rewritten;
- both participants see the same canonical order state;
- payment language remains truthful while payment is unavailable.

### Phase 7 — Platform payment, ledger, refund, and payout

**Weeks 35–37 discovery/contract · 26 Apr–14 May 2027**  
**Weeks 38–42 implementation · 17 May–18 Jun 2027**

**Prerequisite decisions:** Ghana provider, supported Mobile Money/card methods, merchant-of-record/custody model, fees, payout timing, tax/invoice duties, cancellation/refund rules, dispute evidence, reconciliation ownership, and legal language.

Deliverables:

- provider adapter and sandbox environment separated from production credentials;
- payment intent, attempt, verified webhook, canonical payment, ledger entry, refund, payout, reconciliation, and audit records;
- signature verification, replay protection, idempotency, amount/currency checks, and safe webhook retries;
- double-entry or equivalently auditable ledger design reviewed by a qualified accounting owner;
- Buyer payment UI with exact amount, fees, method, status, receipt, failure, retry, and abandoned-payment recovery;
- Seller balance/payout view based only on canonical ledger state;
- Admin reconciliation, refund, payout-hold, exception, and incident tools with dual-control where risk requires it;
- scheduled reconciliation and mismatch alerts;
- no use of “escrow,” “insured,” “guaranteed,” or regulated security claims unless contracts and legal review support them.

Exit gate:

- sandbox success, decline, timeout, duplicate webhook, delayed webhook, partial refund, full refund, payout failure, and reconciliation mismatch tests pass;
- no provider callback alone can produce duplicate value or an impossible order state;
- accounting records reconcile to provider records;
- rollback, credential rotation, incident, and manual-reconciliation runbooks exist;
- legal/product/operations owners approve all customer-facing claims.

### Phase 8 — Production progress, fittings, handover, and resolution

**Weeks 43–46 · 21 Jun–16 Jul 2027**

**Purpose:** carry a paid commission through real work and terminal outcomes.

Deliverables:

- agreed milestone template and Seller progress updates;
- fitting proposal, confirmation, reschedule, completion, and no-show states;
- Buyer-visible progress timeline and evidence where policy permits;
- collection/delivery method, address privacy, handover record, and proof of receipt;
- cancellation, issue report, evidence, response, resolution, refund, payout-release, and closure integration;
- Administrator case queue, assignment, SLA, notes, evidence access, decision, appeal, and immutable audit;
- defined notification and money outcome for every terminal state.

Exit gate:

- order, payment, payout, notification, and audit state remain consistent for completion, cancellation, refund, dispute, and timeout;
- cases cannot be silently deleted, reassigned, or decided without attribution;
- delivery promises match the actual pilot arrangement.

### Phase 9 — Verified reviews, moderation, and support

**Weeks 47–48 · 19–30 Jul 2027**

Deliverables:

- review eligibility only after a qualifying completed transaction;
- one review per eligible policy, review window, transparent aggregation, Seller response, report, moderation, and appeal;
- listing/content/user report intake and moderation queues;
- support case intake, categorization, ownership, SLA, internal notes, and user-visible updates;
- anti-spam, coercion, duplicate, and retaliatory-review controls;
- account/Seller/listing restriction that preserves history and active-case handling.

Exit gate:

- no unverified review can be published;
- support and moderation teams can trace every action;
- restriction cannot orphan active money or dispute obligations.

### Phase 10 — Production readiness and controlled launch

**Weeks 49–52 · 2–27 Aug 2027**

Infrastructure:

- separate development, staging, and production projects/databases;
- frontend on a static/edge host and AdonisJS on a long-running Node host that supports streaming SSE;
- durable public/private object storage, production transactional email, HTTPS, secure cookies, DNS, secrets management, and environment-specific CORS;
- migration gate, health/readiness probes, graceful deployment, rollback, backup, and tested restoration;
- Redis introduced only if measured cache or multi-instance coordination needs justify it.

Assurance:

- formal authorization, session, CSRF/CORS, injection, upload, rate-limit, secret, dependency, and privacy review;
- accessibility audit against WCAG 2.2 AA targets;
- mid-range mobile and constrained-network performance tests;
- load tests for public search, login, order reads, webhooks, SSE connections, and Admin queues;
- observability dashboards and alerts for latency, errors, database, email, uploads, payments, SSE, and security events;
- data export/deletion and retention jobs aligned with approved policy;
- Terms, Privacy, Seller standards, refund/cancellation, dispute, prohibited-content, and support policies approved;
- incident response, payment incident, account compromise, evidence access, moderation escalation, and communications runbooks rehearsed.

Launch sequence:

1. staff-only production smoke test;
2. invited Sellers complete profile/verification/storefront onboarding;
3. invited Buyers complete supervised sandbox-equivalent journeys;
4. limited real-money pilot with low limits and daily reconciliation;
5. expand invitations only after two stable reconciliation cycles and support review;
6. public opening with rollback switches and staffed monitoring.

Exit gate:

- production readiness checklist is signed by product, engineering, operations, security, finance/accounting, and legal owners;
- pilot users complete end-to-end real journeys on mobile and desktop;
- backup restoration and payment reconciliation are proven;
- no unresolved critical issue and every high issue has an approved owner/date or blocks launch.

### Phase 11 — Stabilization and initial-product completion

**Weeks 53–64 · 30 Aug–19 Nov 2027**

The first 12 post-launch weeks prioritize correctness and operations over new feature volume.

Deliverables:

- daily then weekly review of authentication, conversion, payment, reconciliation, fulfilment, dispute, support, and availability metrics;
- resolve launch defects and simplify confusing journeys using observed evidence;
- database query/index review using production access patterns;
- tune safe public caches and introduce Redis only where measurements show value;
- capacity planning for SSE connections, workers/jobs, email, storage, database, and support;
- accessibility and responsive regression passes after material changes;
- retention/deletion jobs and operational audits observed in production;
- post-incident reviews with corrective tests and runbook changes;
- release cadence, ownership map, and maintenance budget established.

Initial-product completion gate:

- at least one representative real transaction has completed every supported lifecycle, including a controlled refund/failure exercise;
- reconciliation remains accurate for four consecutive weeks;
- backup restore meets the agreed recovery objectives;
- critical journeys meet agreed availability, latency, accessibility, and support targets;
- no critical security, privacy, payment, or data-integrity defect remains open;
- all visible product claims are evidenced by active operational capability;
- the team can operate the marketplace without developer-only database intervention for normal cases.

## 6. Continuous workstreams

These run throughout the timeline and are included in phase estimates.

### Product and design

- validate each workflow with Buyers, makers, and operators before implementation;
- maintain one responsive component system instead of separate desktop/tablet/mobile products;
- treat compactness, touch targets, keyboard access, screen-reader names, contrast, and poor connectivity as requirements;
- remove decorative dashboard data and fake controls; every visible action must have a real state or be clearly unavailable.

### Security and privacy

- threat-model each new sensitive domain;
- least-privilege server authorization, short-lived private media access, secure sessions, rate limits, audit, dependency review, and secret rotation;
- never log passwords, tokens, private measurements, message bodies, payment credentials, or identity evidence;
- preserve data through backward-compatible migrations and tested recovery.

### Quality

- strict TypeScript and boundary parsing;
- domain/service unit tests;
- API/database integration tests with real constraints;
- browser end-to-end tests for each role and lifecycle;
- responsive screenshots at content-driven breakpoints, not device-name conditionals;
- accessibility checks plus manual keyboard/screen-reader sampling;
- failure, duplicate, retry, stale state, authorization, and offline/reconnect tests.

### Operations and analytics

- correlation IDs, structured logs, meaningful metrics, audit trails, alerts, and runbooks;
- collect only privacy-safe product funnel events;
- measure useful outcomes: approved active Sellers, discovery-to-request conversion, quote acceptance, successful payment, on-time completion, dispute rate, refund time, support time, and repeat use;
- do not optimize vanity traffic at the expense of completed trustworthy commissions.

## 7. Critical decisions and latest safe deadlines

| Decision | Owner required | Latest safe deadline | Blocks |
|---|---|---:|---|
| Pilot crafts and geographic boundaries | Product + operations | Week 4 | Seller fields, discovery filters, delivery |
| Ghana Card/manual verification method and evidence retention | Legal + operations + security | Week 5 | Private verification implementation |
| Seller publication standards | Product + operations | Week 6 | Public storefront release |
| Seller-to-Buyer capability policy | Product + security | Week 12 | Buyer authorization edge cases |
| Cancellation rules before/after work starts | Product + legal + operations | Week 24 | Quote and order terms |
| Payment provider and supported methods | Finance + legal + engineering | Week 28 | Payment build |
| Funds flow, fees, payout timing, refunds, tax/invoices | Finance + legal | Week 31 | Ledger and customer language |
| Delivery/collection pilot | Operations + legal | Week 36 | Handover workflow |
| Dispute evidence and appeal policy | Legal + operations | Week 38 | Resolution tools |
| Support channels, hours, and SLAs | Operations | Week 42 | Launch staffing and policies |
| Production hosts, storage, email, monitoring | Engineering + finance | Week 44 | Production readiness |

Decisions must be recorded with evidence, date, owner, alternatives considered, and consequences. Silence is not approval.

## 8. Dependency and critical path

```text
Stable Auth and one identity
  → approved Seller capability
  → verified Seller profile and public storefront
  → public discovery
  → selected-maker request
  → participant conversation
  → versioned quote
  → canonical commission order
  → approved payment and ledger model
  → fulfilment and resolution
  → transaction-verified review
  → controlled launch
  → stabilization and initial-product completion
```

Work that can proceed in parallel without violating this path:

- policy research can start immediately;
- production infrastructure can be prototyped after Phase 0;
- design can stay one phase ahead of implementation;
- Admin operations may be built with each domain instead of waiting for a final Admin sprint;
- accessibility, security, observability, and performance checks run with every phase.

## 9. Release rules

A feature is not marked complete because a screen exists. It is complete only when it has:

- real database state and preserved migrations;
- strict API contracts and explicit errors;
- server-side role, ownership, state, and version checks;
- an explicit lifecycle including duplicate, failure, cancellation, and recovery behavior;
- responsive, accessible success/loading/empty/error/offline UI;
- appropriate notifications, audit, metrics, and operator visibility;
- automated focused tests and live browser proof;
- truthful content and documented operational ownership.

Every release must also pass:

- clean install or reproducible deployment;
- lint, typecheck, tests, and production builds;
- migration-forward verification and a recovery plan;
- secret and private-file scan;
- main-role browser smoke tests;
- mobile/tablet/desktop containment checks;
- final diff review for unrelated changes and fake/incomplete claims.

## 10. Explicitly deferred beyond the initial product

These are considered only after the stabilization gate and evidence of demand:

- opt-in, explainable maker recommendations that never override customer choice;
- broader ready-made checkout/catalogue emphasis;
- native mobile applications;
- external search infrastructure;
- complex business analytics for Sellers;
- multi-region or nationwide delivery claims;
- paid ranking or advertising;
- social-feed mechanics;
- multi-currency settlement beyond what the chosen provider and accounting model truly support.

They enter a new roadmap only with a user problem, privacy/state model, operational owner, measured success criterion, and explicit approval.

## 11. End state

The initial Nkabom project is finished when the production system and operating team can repeatedly deliver this promise without hidden manual engineering work:

> A customer can see authentic work, choose an approved maker, create a private and recoverable request, agree to a stable quote, pay through an accurately reconciled platform process, follow the commission, complete or resolve it, and leave a transaction-verified review—while every sensitive action remains authorized, private, attributable, and supportable.

Anything less is a milestone toward the product, not the end of the project.
