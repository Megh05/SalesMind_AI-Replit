# OmniReach Design Guidelines

## Design Approach

**Selected Framework:** Modern SaaS Design System approach inspired by Linear, Notion, and contemporary productivity tools

**Core Principles:**
- Professional clarity for data-dense interfaces
- Intuitive navigation for non-technical users
- Visual hierarchy that guides users through complex workflows
- Spatial organization that reduces cognitive load
- Purposeful white space that doesn't feel empty

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - UI elements, body text, data displays
- Accent: JetBrains Mono (via Google Fonts CDN) - Code snippets, technical IDs, workflow node labels

**Type Scale:**
- Hero/Page Titles: text-4xl md:text-5xl, font-bold
- Section Headers: text-2xl md:text-3xl, font-semibold
- Card/Module Titles: text-lg md:text-xl, font-semibold
- Body Text: text-base, font-normal
- Supporting Text: text-sm, font-normal
- Micro Text (labels, timestamps): text-xs, font-medium
- Workflow Node Labels: text-sm, font-mono

**Line Heights:**
- Headlines: leading-tight
- Body content: leading-relaxed
- Dense data tables: leading-normal

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 consistently
- Micro spacing (within components): p-2, gap-2, space-x-2
- Standard spacing (between elements): p-4, gap-4, mb-4
- Section padding: py-8 md:py-12
- Page margins: px-6 md:px-8 lg:px-12
- Major section breaks: gap-16, py-16

**Grid Structure:**
- Main application: Sidebar (w-64) + Main content area (flex-1)
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Analytics panels: grid-cols-1 lg:grid-cols-2
- Lead table: Full width with horizontal scroll on mobile
- Workflow canvas: Full viewport minus header/sidebar

**Container Widths:**
- Standard pages: max-w-7xl mx-auto
- Focused forms: max-w-2xl mx-auto
- Full-bleed workflow builder: w-full h-full
- Modal dialogs: w-full max-w-lg md:max-w-xl

---

## Component Library

### Navigation & Layout

**Top Header Bar:**
- Fixed position, h-16, subtle shadow
- Logo (left), search bar (center), notifications + user menu (right)
- Breadcrumb navigation below header for context

**Sidebar Navigation:**
- Fixed left sidebar, w-64, full height
- Sections: Dashboard, Leads, Workflows, Personas, Analytics, Settings
- Active state: subtle background treatment with left border accent
- Collapsible on mobile (overlay)

**Page Layout Pattern:**
- Header section: Page title (text-3xl, font-bold) + primary action button (right aligned)
- Optional: Stats row immediately below header (grid of metric cards)
- Main content area: Cards or data displays with consistent spacing (gap-6)

### Core UI Elements

**Cards:**
- Rounded corners: rounded-lg
- Subtle elevation: shadow-sm, hover:shadow-md transition
- Padding: p-6
- Header + content structure with clear separation

**Buttons:**
- Primary: Large click targets, px-6 py-3, rounded-lg, font-semibold
- Secondary: Same size, different treatment
- Icon buttons: p-2, rounded-md for compact actions
- Button groups: gap-2, flex items-center

**Tables:**
- Striped rows for readability
- Sticky header when scrolling
- Row hover states
- Action buttons (right-aligned) per row
- Pagination controls at bottom

**Form Inputs:**
- Consistent height: h-10 or h-11
- Rounded: rounded-md
- Focus states with clear visual feedback
- Labels: text-sm font-medium mb-2
- Helper text: text-xs below input
- Required field indicators

### Specialized Components

**Workflow Builder Canvas:**
- Full viewport area with zoom controls (bottom-right)
- Minimap (bottom-left corner)
- Node palette sidebar (left, collapsible)
- Connection lines with smooth bezier curves
- Node types:
  - Action nodes: Rectangular, rounded-lg, icon + label
  - Decision nodes: Diamond shape
  - Delay nodes: Circular
  - Multi-channel nodes: Split into channel icons
- Selected node: Prominent outline, properties panel (right sidebar)

**Persona Cards:**
- Horizontal layout: Avatar placeholder (left) + details (right)
- Compact info: Name, tone indicators, stats
- Quick actions: Edit, duplicate, delete (top-right)
- Grid display: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-4

**Lead Management Table:**
- Columns: Name, Company, Status, Last Contact, Channel, Score, Actions
- Status badges with rounded-full design
- Channel icons inline
- Bulk action toolbar when rows selected
- Quick filters above table (tabs for status)

**Analytics Dashboard:**
- Top row: 4 KPI cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Chart area: Large card containing charts
- Chart types: Line (engagement over time), Bar (channel comparison), Donut (status distribution)
- Date range selector (top-right)

**Multi-Channel Message Preview:**
- Tabbed interface: Email | SMS | LinkedIn preview
- Preview card showing message exactly as recipient sees it
- AI generation controls below preview
- Regenerate button with loading state

**Workflow Execution Logs:**
- Timeline view with vertical line connecting events
- Event cards: Timestamp (left), icon (center), description (right)
- Expandable details per event
- Status indicators: Success (checkmark), Pending (spinner), Error (alert)

### Overlays & Modals

**Modal Dialogs:**
- Centered overlay with backdrop blur
- Padding: p-6
- Close button (top-right)
- Form modals: Title + form fields + action buttons (bottom)

**Toast Notifications:**
- Fixed position: top-right
- Stacked if multiple
- Auto-dismiss after 5s
- Types: Success, Error, Info, Warning
- Icon + message + close button

**Side Panels:**
- Slide in from right
- w-96, full height
- Used for: Workflow node properties, lead details, persona editing
- Close via backdrop click or X button

---

## Icon System

**Library:** Heroicons (via CDN)
- Outline variants for primary navigation
- Solid variants for buttons and emphasis
- Consistent sizing: w-5 h-5 for standard icons, w-6 h-6 for prominent icons

**Channel Icons:**
- Email, SMS, LinkedIn, Calendar - clear, recognizable
- Use in: Workflow nodes, analytics, lead timeline, message composer

---

## Animations

**Minimal, Purposeful Motion:**
- Page transitions: None (instant, professional)
- Hover states: transition-all duration-200
- Modal appearance: Fade in backdrop + slide up modal (duration-300)
- Workflow node dragging: Smooth follow cursor
- Loading states: Simple spinner, no elaborate animations
- Toast notifications: Slide in from right

---

## Images

**Dashboard Hero/Empty States:**
- Illustration style: Modern, minimal line art for empty states
- Placement: Centered in empty workflow canvas, empty lead list
- Context: "No leads yet - Import CSV or create first lead"

**Persona Avatars:**
- Circular placeholder with initials if no image
- Size: w-12 h-12 in lists, w-24 h-24 in detail view

**No large hero images** - This is a productivity tool, not a marketing site. Focus remains on data and functionality.

---

## Responsive Strategy

**Breakpoints:**
- Mobile: Base styles, stacked layouts, collapsed sidebar
- Tablet (md:): 2-column grids, visible sidebar
- Desktop (lg:): 3-4 column grids, full sidebar, multi-panel views

**Mobile Considerations:**
- Workflow builder: Limited on mobile, show "Best viewed on desktop" message
- Tables: Horizontal scroll with sticky first column
- Sidebar: Hamburger menu overlay
- Forms: Full width, stacked fields

---

## Accessibility

- Keyboard navigation throughout
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Semantic HTML structure
- Form inputs with associated labels
- Error messages clearly linked to inputs
- Sufficient contrast ratios (design system handles this)

---

## Quality Standards

This is a professional B2B SaaS platform. Every screen should feel:
- **Confident:** Clear hierarchy, decisive design choices
- **Efficient:** Dense but not cluttered, information readily accessible
- **Intelligent:** AI features feel integrated, not bolted on
- **Trustworthy:** Consistent patterns, reliable interactions, professional polish

Avoid: Unnecessary animations, decorative elements, marketing-style flourishes. This tool is about getting work done effectively.