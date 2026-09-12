# AAA Data Solutions — UI/UX & Design Guidelines

This document defines the strict UI/UX standards, visual design language, interaction patterns, and component rules across all admin and client dashboard sections.

---

## 1. Core Visual Philosophy: Minimalist & Warm

- **Clean & Purposeful**: Avoid visual clutter, unnecessary elements, or decorative fluff ("AI slop").
- **Natural Left-Alignment**: Always left-align text, table cells, lists, metric labels, form fields, and cards. Never force center-alignment where it breaks visual hierarchy.
- **Warm & High-Contrast**:
  - Background: Crisp, subtle warm light (`#f8fafc` / `#fafafa`) and deep refined dark (`#0f1015` / `#15161c`).
  - Text: Clear readability (`text-slate-900 dark:text-white` for primary, `text-slate-500 dark:text-slate-400` for secondary). **Strictly avoid unreadable washed-out light gray fonts.**
  - Weight: Use `font-semibold` or `font-medium` for headers/labels, and standard regular weight for body text. **Avoid excessive, heavy bolding.**

---

## 2. Color Palette & Icon Design Tokens

### Primary Buttons & Actions
- **Primary Brand Accent**: Indigo / Purple (`bg-[#4f46e5] hover:bg-[#4338ca] text-white`).
- **Secondary Buttons**: Clean bordered slate (`border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27]`).

### Metric & Feature Icons
- **Icon Sizing**: Small, refined icons (`w-3.5 h-3.5` or `w-4 h-4`), inside subtle `w-7 h-7` or `w-8 h-8` rounded containers.
- **Icon Palette**:
  - Organizations / Portfolios: Indigo (`bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400`).
  - Properties / Layers: Blue (`bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400`).
  - Telecom Services / Voice: Purple (`bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400`).
  - Pending Actions / Alerts: Amber (`bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400`).

### Status Badges & Pills
Always use the subtle dot + pill design with consistent semantic colors:
- **Active**: Soft emerald pill (`bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40` with `bg-emerald-500` dot).
- **Inactive / Suspended**: Soft amber pill (`bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40` with `bg-amber-500` dot).
- **Archived**: Soft rose pill (`bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40` with `bg-rose-500` dot).

---

## 3. Table & List Standards

- **Header Typography**: Uppercase `text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#111217]`.
- **Card & Table Borders**: Fine, crisp border (`border border-slate-200/80 dark:border-[#222430] rounded-xl`).
- **Row Hover**: Subtle transition (`hover:bg-slate-50/60 dark:hover:bg-[#181a24]`).
- **Server-Side Pagination**: 10 records per page by default, showing `"Showing X to Y of Z items"`, numbered page buttons, and Previous/Next controls.
- **Deep-Links**: Primary title/name is clickable, external view links have `target="_blank"` with small `ArrowUpRight` icon.

---

## 4. Action Dropdowns (3-Dots Menu)

- **Positioning Rule**: Never render action dropdowns directly inside an `overflow-x-auto` or `overflow-hidden` table container.
- **Fixed Overlay Approach**: Render via a fixed overlay with dynamic viewport coordinates (`menuPosition: { top, left, org }`) so dropdowns float cleanly above all containers without triggering table vertical scrollbars or clipping.

---

## 5. Loading, Empty & Error States

- **Skeleton Loaders**: Always render shimmer pulse skeleton rows and KPI skeletons on initial fetch or filter changes (never blank pages or unstyled "Loading...").
- **Button Loaders**: Display a small spinning loader (`Loader2 w-3.5 h-3.5 animate-spin`) during mutation/submit actions.
- **Empty States**: Contextual empty card with an icon, descriptive explanation, and a "Clear Filters" or "Create" CTA.
- **Error States**: Clear error message with an inline "Retry" button.

---

## 6. Feedback & Toast Notifications

- **Placement**: Fixed top-right (`top-6 right-6 z-[9999]`), dark backdrop with semantic left-border/glow.
- **Triggers**: Show toast on every mutation (Create, Edit, Assign, Unassign, Status change, Add Contact).
- **Behavior**: Auto-dismiss after 4 seconds + manual close (`X`) button.

---

## 7. Drawers, Modals & Forms

- **Drawers**: Right-side slide-over for complex edits and item lists (Assigned Properties, Contact List).
- **Modals**: Centered, backdrop-blurred card for concise actions (Create, Assign Property, Change Status).
- **Searchable Selectors**: Search in assignment modals must be debounced, querying database records with instant select feedback.
- **Contact Details**: Always display full contact information (Full Name, Email, Phone Number, Primary badge).
- **Confirmation Prompts**: Show explicit confirmation dialogs before major state changes (e.g. replacing an existing primary contact or archiving an organization).
