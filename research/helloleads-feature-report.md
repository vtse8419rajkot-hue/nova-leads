# HelloLeads Feature Report (deep scan)

Sources actually loaded: helloleads.io homepage, /top-features (+ /top-features/{SMS,attach-files-videos,schedule-follow-ups,custom-fields,quick-quotes,instant-invoices,hello-form}), /pricing, /faq, knowledge-base (8 categories + articles: adding-and-managing-leads, set-follow-up-and-engage-with-your-leads, describe-your-leads-better, qualify-your-leads-and-improve-effectiveness, create-and-share-quotes-invoices, bring-your-team-members-in-same-page, whatsapping-your-leads, track-your-teams-activities-and-improve-sales), app.helloleads.io login + register pages, demo-request wizard (interactive), Google Play + App Store listings. G2/Capterra and helpcube docs were blocked/unreachable.

## 1. Signup / Onboarding
- Web register (app.helloleads.io/index.php/app/account/register) fields: **Name, Organization Name, phone (country-code dropdown — all countries, digits-only box), Business Email, Create Password (show/hide), reCAPTCHA**; "Get Started" disabled until valid; links to Terms + Privacy. Marketing-site embed adds a math captcha ("3 + 2 =").
- Login page: Email, Password, Remember-me, **Login using OTP**, Forgot password, "Start 30-Day Trial", "Demo for new users".
- Demo-request wizard (helloleads.io/demo-request) — multi-step, "Your progress/Status" indicator, headline "Let's build a demo around your needs, not a generic tour." Fields:
  - Goal (radio): Manage & follow up leads I already have / Generate new leads or find new customers / Lead Management and Lead Generation / Improve Sales Productivity for my business
  - Preferred time slot: Today / Tomorrow / This Week / Next Week
  - Primary goal (checkboxes): Managing new leads faster; Improving team follow-ups; Tracking sales performance; Replacing a complex CRM; Offering CRM solutions to my own clients (Agency/Consultant)
  - **"What type of business do you run?" (dropdown, 14 options):** Real Estate / Property; Finance & Insurance; Digital Marketing Agency; Consulting & Advisory; IT / Software Services; Manufacturing & Trading; Retail & E-commerce; Training & Education; Healthcare & Pharma; Automotive; Business Services; Travel & Tourism; Food & Beverage; Other
  - Company name, Website, "Tell us about your business (Just 3 lines)" (0/300 chars)
  - Business Category: B2B / B2C / B2B and B2C
  - Your role: Owner / Founder, Sales Manager, Sales Rep, Marketing, IT / Ops, Other
  - Team size: Just me / 2–5 / 6–15 / 16–50 / More than 50 → "Continue →"
- The post-signup in-app onboarding wizard (business-type picker inside the app) could not be reached without creating a verified account — industry list above is from the demo wizard; site's industry landing pages (Business Services, Real Estate, Finance & Insurance, Consulting & Advisory, E-Commerce & Retail, Auto Dealership, Marketing, Manufacturing, Trading, Training & Education, Fitness & Wellness, Software & IT, Medical & Pharma, Events & Tradeshow) align with it. (unverified for exact in-app wizard)

## 2. Lead form fields (Add/Edit Lead)
- Basic: Lead name, Designation/Title, Organization
- Contact: Email ID, Mobile Number, Direct Number, Office Number, Website, Address, City, State, Zip, Country
- Qualifiers: Lead Potential (High / Medium / Low / Not relevant), Customer Group, Product Group, Lead Stage, Deal Size (currency selectable, default USD; USD, GBP, EUR, AED, JPY, INR…), Tags, Notes (free text + speech-to-text)
- Additional ("Info+"): About the lead, About their company, Related web links / social links, Birthday, Special date
- Follow-up info: follow-up date & time, assigned user
- System-captured: added-by user, GPS capture location, capture timestamp
- Custom fields: types = **Text box, Text area, Dropdown, Date**; mandatory toggle; created in Web app Settings → Qualifiers → Custom Fields; **must be mapped to a List** to appear in the Add Lead form; recommended ≤10 (max 25); plan limits (Free 5, Essential 25); included in per-list Excel import template.
- Add Lead form is multi-tab (tabs optional; e.g., "Qualifier Info" tab), with a **Quick Add** minimal-field variant.
- ~15 lead-adding methods: Add Lead form, Import phone contacts, Call logs, WhatsApp logs, Facebook Lead Ads (auto-list "FB_Leads_#PageName#", 90-day back-import, ad↔list mapping), Call-enquiry popup after calls (+ Quick action buttons, "Not a lead, ignore in future"), Quick add, Business card scan (English cards; front/rear; multi-card batch; ML transcription with drag-drop field mapping), QR/vCard scan, VCF import, Excel import (duplicate check on email+mobile, "Allow duplicate entries" toggle), Website enquiry form, Hello Form (shareable like Google Form), Instagram, API/3rd-party lead-gen platforms, SMS/IVR provider integrations.

## 3. Lead detail screen
- "Action circles" on lead details: **phone call, WhatsApp, text/SMS, email, quotes & invoices ($)** — each opens saved message templates first.
- Follow-up screen: set/change follow-up date+time, assign to specific user, repeat follow-up toggle, Do-Not-Follow-Up flag, Google Calendar sync icon.
- Activities/timeline: user comments + system logs; **attachments are added as Activities**; call recordings auto-attached; speech-to-text for comments.
- Info+ section for social/web links; geo-location of capture; color-coded follow-up flags (red bell with strike = do-not-follow-up); quick edit of qualifiers.
(Full section-by-section layout partly inferred from KB prose + screenshots — mark detailed layout as partially unverified.)

## 4. Favorites
- **Not verified.** No mention of "favorite/favourite" in FAQ or any KB article loaded. Closest verified feature: **Lead Lock** — "Protect important leads from accidental edits or reassignment" (pricing bullet, Enterprise "Lead locking control"). Treat HelloLeads favorites as unconfirmed; if we copy it into Nova Leads, it's our own design.

## 5. Attachments
- Attach & share files and videos with leads from CRM; formats: **PDFs, images, video files "and more"** (use cases: product brochures, pricing documents, proposal PDFs, demo videos, service presentations).
- Stored linked to the lead record ("All attachments are linked directly to the lead record"), added as Activities, sync between mobile and web; can be attached to WhatsApp/text/email templates; call recordings auto-attach.

## 6. SMS
- SMS is sent from the lead profile via **the phone's own messaging app** — verified KB note: "For sending WhatsApp, text/SMS or email from your HelloLeads mobile app, the number or email id that is configured in your phone will be used." Template picker appears first; "None" opens the SMS app with empty body. Number choice: Mobile / Office / Direct ("Change Number").
- Templates: user-created, personalized with placeholders **#LeadName#, #LeadCompanyName#**; templates are **user-specific and device-specific**; attachments can be attached to templates.
- Also: **Bulk Text/SMS** to many leads at once; per-list **auto-text reply** ("custom SMS/text reply configured while creating/editing a list"); 3rd-party SMS/texting provider integrations (for gateway-style sending); "Instant hello!" auto-greeting on lead add.

## 7. Follow-ups / Reminders
- Set follow-up date + time per lead, assign to any user; auto-assignment rules (self-added → self; FB/website/3rd-party → list owner; Excel import → optional user by email).
- **Repeat follow-up**: weekly / monthly / quarterly / annually; next date auto-reset: Weekly→+7 days, Monthly→+30 days, Quarterly→+3 months, Annually→+12 months.
- Reminders: **email + push notification + on-time alarm** (Android alarm); "Fail-Safe Follow-Up" is their marketing name.
- **Do Not Follow Up** flag → red bell with strike icon near lead.
- Calendar view in mobile app: day list of leads to follow up, sorted by time; filters by follow-up date; Google Calendar integration (Settings → Google Calendar integration).
- Google Calendar sync; Web: follow-ups visible on dashboard/reports.

## 8. Pipeline / Stages
- 8 pre-set stages (KB): **Open** (enquiry received), **Contacted**, **Nurturing** (default off), **Qualified** (quote/estimate shared), **Negotiation** (default off), **Customer (Won)**, **Inactive**, **Unqualified**. FAQ lists 6 active by default; customizable from 3 to 8 stages with rename via Web Settings → Lead Stage Customization (account-level). "Won" stage drives Leads-won/deal-value reporting.

## 9. Team & Roles
- Add via Menu → My Team → [+] (details + role).
- 4 built-in roles: **Account owner, Manager, L1 User, L2 User** with a permission matrix (what each can view/manage/transaction limits).
- Unauthorized-access attempt triggers an **email alert to the account owner**. Export to Excel/CSV restricted to account owners.
- Communicate with teammates via call / message / email / WhatsApp from user profile.
- **My Team Performance** KPIs: reward points, leads added, leads won, won deal value, comments added, calls handled (total/incoming/outgoing) + call duration, WhatsApp activities, texting activities, email activities, quotes created, invoices created, app usage time, locations visited. Each KPI shows % of total and % change vs previous period (this week/month; none for lifetime/custom).
- **Gamification reward points**: Add lead 1 · Change stage 3 · Stage→Won 5 · Add activity 2 · Call/WhatsApp/Text/Email 2 · Create quote 4 · Create invoice 6.

## 10. Quotes / Invoices
- Created from **$ action circle** on lead detail or Quotes & Invoices menu; 4-step flow ([+] → add product → save via tick).
- Product line: name, price, quantity, description; **Product Catalog** with autosuggest (price locked when chosen from catalog; type name manually to override price).
- Customization: org name, logo, signature, quote title rename (Proforma Invoice / Estimate / Price Proposal), number **prefix + sequential numbering** (consistent across mobile & web), discount % or amount, tax %, additional charges (shipping, COD, packing), validity. Editable fields shown **in blue font**.
- Share via WhatsApp/email from preview (⁝ → Share); **convert quote → invoice**; payment status **Unpaid → Partially Paid → Fully Paid**; edit/clone/share/preview/delete; all synced to web app.

## 11. Reports / Dashboard
- Reports across qualifiers: Lead stage, Potential, Customer group, Product group; **Sales funnel** graphic = lead count per stage.
- Team performance dashboards (KPIs above), call stats incl. incoming/outgoing split and duration.
- **Map view** of leads (web dashboard map option; Android location icon); "Leads near me" for field planning.
- Export leads to Excel/CSV (account owner); Slice & dice with filters and sorting; lead scores ("Leads that matter").

## 12. Other distinctive UX touches worth copying
- **Lists** as the core organizing unit (group by source/campaign/region; per-list custom greeting email + auto SMS; custom fields mapped per list; FB lists auto-created).
- Plan structure & limits (Free: 250 leads, 5 users, 10 lists, 10 to-dos/user, 5 custom fields, WhatsApp connect, landing pages, quotes/invoices; Essential: 50k leads, 50 users, 25 lists, 5,000 to-dos, 25 fields, unlimited quotes/invoices, telephony; Enterprise: 100k leads, 500 users, auto lead assignment, unlimited accessories, advanced access control, lead locking). Volume discounts: >10 users 10%, >25 15%, >50 20%, >100 25%. 30-day trial, no credit card, 30-day money-back; geo-localized currency (page rendered HKD for our location; USD default).
- Auto-wishes: **Happy Birthday!** auto-wish; **Instant hello!** auto intro email/greeting on lead add.
- Field sales: check-in/check-out on customer visits ("Keeping a track of customer visits"), "Leads near me", auto-attach call recordings, HelloDIAL/Call-CRM post-call popup, Exotel IVR (call recording + number masking).
- WhatsApp: template-first messaging, WATI integration, WhatsApp-log lead capture; "Hello Connect" umbrella for call/WhatsApp/text/email.
- Landing pages / HelloPage (no-code, campaign pages), Hello Forms, WordPress/Wix/Facebook/Instagram/Google Ads capture, Zapier & Pabbly, open APIs.
- To-Dos (Hello To-Do) separate from follow-ups, with plan quotas; Data clean-up (remove incomplete/stale/duplicate leads); offline access + auto-sync every few minutes + manual sync (Settings → Sync Data).
- Multi-language UI (EN, ES, AR, DE, FR, IT, PT, HI, RU, ID, IW, TW); "Ask Linda" AI support; 👍 marketing cues (✅ bullets, emoji pain-point cards, follow-up color-coded flags, editable-blue convention).
