# Refactor Spec: Property Listing & Search Interface (Asia Stays)

> Saved from the design/eng brief used during the Asia Stays audit + cleanup stream.
> Context: the live site is plain React + inline-styles + `var(--as-*)` warm tokens
> (Japandi/Mediterranean: terracotta `#C87D53`, cream `#FAF8F5`). This spec was written
> assuming Tailwind/TS/Lucide — we applied its *spirit* on top of the existing stack
> (see `src/App.jsx` `cleanPropertyDescription` / `PropertyModal.jsx` local sanitization guard).

---

Act as a Principal Frontend Engineer and Lead UI/UX Designer specializing in PropTech
platforms (like Airbnb, Zillow, NomadList).

Refactor the property listing and search interface for "Asia Stays" (Real Estate Platform)
built with React, Tailwind CSS, and Lucide Icons. The current UI suffers from raw unparsed
markdown text, inconsistent typography, mismatched component radii, and visual noise.

### Core Tasks & Engineering Specifications

#### 1. Data Sanitization & Cleaning Pipeline (Mandatory Data Layer)
Write a helper parser function `cleanPropertyDescription(rawText: string)` before rendering the modal:
- Markdown Removal: Strip out all raw Markdown artifacts (`**`, `__`, `---`, `***`, `#`).
- Emoji Filtering: Remove random system emojis (🧺, 🧹, 💯, 🪠, 🛏️) from raw descriptions.
- Template Guardrails: Filter out boilerplate strings like `[TEMPLATE]`, `L`, or broken orphan characters.
- Link Extraction: Extract Telegram handles (`@username` or t.me/...) and WhatsApp phone
  numbers using Regex, transforming them into structured objects
  `{ type: 'telegram' | 'whatsapp', url: string }` instead of rendering raw URL strings.
- Number Formatting: Convert raw numeric values like `25000000` into human-readable currency
  formats (e.g., `25,000,000 VND` or `25M VND`).

#### 2. Design System & Style Tokens
Apply a cohesive, premium warm-aesthetic palette (Japandi / Mediterranean Resort style):
- Typography: Enforce font-sans (Inter / Plus Jakarta Sans) globally. Eliminate all Serif fonts
  from body and UI components.
  - H1 / Titles: `text-xl font-semibold text-neutral-900 tracking-tight`
  - Labels: `text-[11px] font-bold uppercase tracking-wider text-neutral-400`
  - Body Text: `text-sm text-neutral-600 leading-relaxed`
- Color Palette:
  - Background Base: `bg-[#FAF8F5]` (Warm Off-White)
  - Surface Accent / Cards: `bg-white border border-neutral-200/80 shadow-xs`
  - Primary Brand Accent: `bg-[#C87D53] hover:bg-[#B56C42] text-white` (Terracotta)
  - Neutral Muted: `bg-neutral-100 text-neutral-700`
- Corner Radii & Spacing:
  - Base Container Radius: `rounded-2xl` (16px)
  - Interactive Elements (Buttons, Inputs, Badges): `rounded-xl` (12px)
  - Spacing Grid: Use strict 8pt rhythm (`gap-2`, `gap-4`, `p-4`, `p-6`).

#### 3. Top Search & Filter Bar Refactoring
- Align all control elements in a single horizontal Flex row (`h-11 items-center gap-2`).
- Replace native emojis with subtle 16px Lucide Icons (`Building2`, `Globe`, `SlidersHorizontal`, `Pin`).
- Clean up currency toggles (`VND | USD | THB`) into a seamless Segmented Control pill container.

#### 4. Listing Modal & Property Details Card (Grid Restructure)
Re-architect the modal dialog using a structured CSS Grid:
- Header: Title, location with a MapPin icon, and a clean close button (`X`).
- Quick-Specs Grid: Render key amenities (Bedrooms, Bathrooms, Floor, Deposit, Cleaning) as
  clean 2x2 or 3x2 info-cards with light borders, an icon, a label, and a clean value.
- Description: Cleaned, formatted text blocks with bullet points using `space-y-2`.
- Sticky CTA Bottom Bar: Fix a sticky container at the bottom of the viewport/modal
  (`sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-neutral-100 p-4`) containing
  two distinct action buttons:
  - Primary Button: "Contact on Telegram" (`bg-[#229ED9]` or Terracotta with Telegram icon).
  - Secondary Button: "WhatsApp" (`bg-[#25D366]` or Outlined with Phone icon).

### Output Requirements
1. Provide the complete TypeScript / React functional component structure.
2. Include the Regex utility functions for parsing raw descriptions.
3. Use Tailwind CSS for all styling (no arbitrary external CSS files).
4. Ensure full responsive design (mobile-first, optimized for iOS Safari viewports).
