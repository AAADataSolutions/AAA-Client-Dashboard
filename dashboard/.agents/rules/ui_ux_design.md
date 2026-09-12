# UI/UX & Design Rules for AAA Solutions Dashboard

## Core Directives
1. **Design Style**: Minimalist, warm, uncluttered design.
2. **Typography**: Use standard weights (`font-normal`, `font-medium`, `font-semibold`). Strictly avoid washed-out, light gray unreadable fonts and excessive bold text.
3. **Alignment**: Natural left-alignment across tables, metrics, cards, and forms. Do not center-align tabular or structured data.
4. **Colors & Accents**:
   - Primary buttons: Indigo / Purple (`bg-[#4f46e5] hover:bg-[#4338ca] text-white`).
   - Icon Badges: Subtle purplish, bluish, indigo accents (`bg-indigo-50 text-indigo-600`, `bg-blue-50 text-blue-600`, `bg-purple-50 text-purple-600`, `bg-amber-50 text-amber-600`).
   - Icon Size: Small, refined icons (`w-3.5 h-3.5` or `w-4 h-4`).
   - Status Pills: Dot + Pill format (`• Active` green, `• Inactive` amber, `• Archived` rose).
5. **Component Interaction Rules**:
   - 3-Dots Dropdowns: Position via fixed viewport coordinates outside table scroll containers to prevent vertical scrollbars and clipping.
   - Skeletons & Loaders: Shimmer pulse skeletons for table and KPI loading states; spinners on submit buttons.
   - Toasts: High-priority top-right toast notifications for all operations.
   - Searchable Modals: Real-time search for entity assignment with instant count updates.
   - Contact Listings: Always display full name, email, phone number, and primary contact status.
