# TALENTRA Design Standard: Unslop UI Architecture

Authoritative specification: `C:\Users\Krishna Chaitanya\Downloads\Unslop_SKILL.md` (by Damir Sokolovsky).
All coding agents (Antigravity, Codex) must apply this persistent design standard whenever inspecting, designing, building, or refactoring UI in TALENTRA.

## TALENTRA Design Direction (5-Point Anchor)
- **Product:** An enterprise recruitment operations platform for corporate talent acquisition teams to manage requisitions, evaluate candidate profiles, and calibrate hiring decisions.
- **Character:** Calm, structured, deliberate, legible, and tool-like. (Forbidden words: clean, modern, sleek, minimal, premium).
- **World:** The structured environment of an executive talent desk: physical requisition folders, crisp evaluation rubrics, high-legibility document typography, and calibrated candidate dossiers.
- **Moments:** 
  1. The requisition document and candidate profile viewer: high-contrast, comfortable reading surface with quiet metadata.
  2. The candidate match breakdown & scoring matrix: transparent criteria signals and rubric comparison tables.
- **Signature:** A crisp hairline status indicator with muted monospace requisition codes (`REQ-001`, `JD-001`) and clear semantic stage badges.

## Mandatory 9-Pass Redline Sequence (In Order)
1. **Spacing:** Strict 4px grid. Standardize row heights (32–36px in nav), cards (20–24px padding), gaps (12–16px). Inner padding must be smaller than outer gap.
2. **Color:** Neutral ramp (slate/zinc); 3 text roles (primary `#0f172a`, secondary `#475569`, muted `#94a3b8`); 1 quiet brand accent (`#4f46e5` indigo); no hue gradients, no colored glows, no colored shadows, hairlines at 6–10% opacity.
3. **Icons:** Line icons only (Lucide React, 16px, 1.5 stroke); zero emojis in interface labels; icons inherit parent text color.
4. **Copy:** Plain factual copy; no hype words (`AI-powered`, `supercharge`, `seamless`); no greeting headlines (`Welcome back!`); no exclamation marks; short, clear labels.
5. **Typography:** Tabular numbers (`tabular-nums`) for figures and dates; sentence case everywhere; font weights limited to 400, 500, and 600 max (no 700–900 black weights).
6. **Layout:** Enterprise proportions capped at 1440–1600px; quiet navigation; 1 primary action button per surface.
7. **Details:** Nested radii rule: $r_{\text{inner}} = r_{\text{outer}} - \text{padding}$; stat cards contain real metrics without decorative sparklines or icon fluff.
8. **Visuals:** Real requisition documents and candidate data; zero decorative blobs, nebulas, or floating elements.
9. **Motion:** No looping animations (`animate-pulse`, `animate-ping`); remove catch-all `transition-all`; subtle 100–150ms hover/active feedback only.

## Strictly Protected Module
- **Interview Timetable (`/interview-timetable`) is STRICTLY LOCKED.** Never modify its components, styles, routes, APIs, or database models.
