# Sevensa Design System Implementation Plan
## PSRA-LTSD Enterprise v2 - Complete Brand Identity Integration

**Datum:** 13 oktober 2025
**Versie:** 1.0
**Status:** Implementation Ready

---

## Executive Summary

Dit document beschrijft de volledige integratie van de Sevensa Brand Identity in de PSRA-LTSD Enterprise v2 applicatie. Het plan omvat een systematic approach voor het implementeren van kleuren, typografie, logo's, componenten en interactiepatronen conform de Sevensa Brand Identity Guide.

### Scope
- **Frontend:** Volledige Next.js/React applicatie
- **Design System:** Tailwind CSS configuratie + custom component library
- **Branding:** Logo integratie, kleurenpalet, typografie, iconografie
- **+1 Feature:** Intelligent Dark Mode met brand-consistent theming

---

## 1. Brand Foundation

### 1.1 Core Values Integration
De applicatie moet deze kernwaarden uitstralen:
- **Integriteit:** Transparante data handling, duidelijke privacy indicators
- **Precisie:** Nauwkeurige data visualisatie, geen misleidende metrics
- **Partnerschap:** Collaborative UI, multi-persona support
- **Innovatie:** Modern design, cutting-edge UX patterns

### 1.2 Target Personas
1. **Compliance Manager (Suus):** Focus op efficiency, detail, compliance
2. **CFO/Manager:** Focus op insights, ROI, risk overview
3. **Supplier:** Focus op simplicity, upload, status tracking

---

## 2. Design Token System

### 2.1 Color Palette

#### Primary Colors
```typescript
const colors = {
  // Brand Primary
  'sevensa-teal': {
    DEFAULT: '#00A896',
    50: '#E5F9F7',
    100: '#CCF3EF',
    200: '#99E7DF',
    300: '#66DBCF',
    400: '#33CFBF',
    500: '#00A896',  // Primary
    600: '#008678',
    700: '#00645A',
    800: '#00433C',
    900: '#00211E',
  },

  // Brand Secondary
  'sevensa-dark': {
    DEFAULT: '#2D3A45',
    50: '#E8EAEC',
    100: '#D1D5D9',
    200: '#A3ABB3',
    300: '#75818D',
    400: '#475767',
    500: '#2D3A45',  // Secondary
    600: '#242E37',
    700: '#1B2329',
    800: '#12171C',
    900: '#090C0E',
  },

  // Semantic Colors
  'success': '#4CAF50',
  'error': '#F44336',
  'warning': '#FF9800',
  'info': '#00A896',
}
```

#### Functional Colors
```typescript
const functionalColors = {
  // Backgrounds
  'bg': {
    base: '#FFFFFF',
    surface: '#F8F9FA',
    muted: '#E9ECEF',
    hover: '#DEE2E6',
  },

  // Text
  'text': {
    primary: '#2D3A45',
    secondary: '#6C757D',
    muted: '#ADB5BD',
    inverse: '#FFFFFF',
  },

  // Borders
  'border': {
    DEFAULT: '#DEE2E6',
    muted: '#E9ECEF',
    strong: '#ADB5BD',
  },
}
```

### 2.2 Typography Scale

#### Font Families
```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

font-family: {
  'sans': ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
  'mono': ['Menlo', 'Monaco', 'Courier New', 'monospace'],
}
```

#### Type Scale
```typescript
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
  '5xl': ['3rem', { lineHeight: '1' }],           // 48px
}

fontWeight: {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
}
```

### 2.3 Spacing & Layout

#### Spacing Scale (4px base unit)
```typescript
spacing: {
  '0': '0',
  '1': '0.25rem',  // 4px
  '2': '0.5rem',   // 8px
  '3': '0.75rem',  // 12px
  '4': '1rem',     // 16px
  '5': '1.25rem',  // 20px
  '6': '1.5rem',   // 24px
  '8': '2rem',     // 32px
  '10': '2.5rem',  // 40px
  '12': '3rem',    // 48px
  '16': '4rem',    // 64px
  '20': '5rem',    // 80px
  '24': '6rem',    // 96px
}
```

#### Grid System
- **Desktop:** 12-column grid, 24px gutter
- **Tablet:** 8-column grid, 16px gutter
- **Mobile:** 4-column grid, 16px gutter

### 2.4 Effects

#### Shadows
```typescript
boxShadow: {
  'xs': '0 1px 2px 0 rgba(45, 58, 69, 0.05)',
  'sm': '0 1px 3px 0 rgba(45, 58, 69, 0.1), 0 1px 2px 0 rgba(45, 58, 69, 0.06)',
  'DEFAULT': '0 4px 6px -1px rgba(45, 58, 69, 0.1), 0 2px 4px -1px rgba(45, 58, 69, 0.06)',
  'md': '0 10px 15px -3px rgba(45, 58, 69, 0.1), 0 4px 6px -2px rgba(45, 58, 69, 0.05)',
  'lg': '0 20px 25px -5px rgba(45, 58, 69, 0.1), 0 10px 10px -5px rgba(45, 58, 69, 0.04)',
  'xl': '0 25px 50px -12px rgba(45, 58, 69, 0.25)',
}
```

#### Border Radius
```typescript
borderRadius: {
  'none': '0',
  'sm': '0.25rem',   // 4px
  'DEFAULT': '0.5rem', // 8px
  'md': '0.75rem',   // 12px
  'lg': '1rem',      // 16px
  'xl': '1.5rem',    // 24px
  '2xl': '2rem',     // 32px
  'full': '9999px',
}
```

---

## 3. Component Library

### 3.1 Button System

#### Primary Button
```tsx
<button className="
  bg-sevensa-teal hover:bg-sevensa-teal-600
  text-white font-semibold
  px-6 py-3 rounded-lg
  transition-all duration-200
  shadow-sm hover:shadow-md
  focus:outline-none focus:ring-2 focus:ring-sevensa-teal focus:ring-offset-2
">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="
  bg-white hover:bg-gray-50
  text-sevensa-dark font-semibold
  border-2 border-sevensa-teal
  px-6 py-3 rounded-lg
  transition-all duration-200
">
  Secondary Action
</button>
```

#### Tertiary Button
```tsx
<button className="
  text-sevensa-teal hover:text-sevensa-teal-600
  font-semibold
  px-4 py-2
  transition-colors duration-200
">
  Tertiary Action
</button>
```

### 3.2 Card System

#### Base Card
```tsx
<div className="
  bg-white rounded-xl
  border border-gray-200
  shadow-sm hover:shadow-md
  transition-shadow duration-200
  p-6
">
  {/* Content */}
</div>
```

#### Dashboard Card (with header)
```tsx
<div className="bg-white rounded-xl border border-gray-200 shadow-sm">
  <div className="border-b border-gray-200 px-6 py-4">
    <h3 className="text-lg font-bold text-sevensa-dark">Card Title</h3>
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

### 3.3 Form Elements

#### Input Field
```tsx
<input className="
  w-full px-4 py-3
  bg-white border-2 border-gray-300
  rounded-lg
  text-sevensa-dark placeholder-gray-400
  focus:border-sevensa-teal focus:ring-2 focus:ring-sevensa-teal/20
  transition-colors duration-200
" />
```

#### Select Dropdown
```tsx
<select className="
  w-full px-4 py-3
  bg-white border-2 border-gray-300
  rounded-lg
  text-sevensa-dark
  focus:border-sevensa-teal focus:ring-2 focus:ring-sevensa-teal/20
  transition-colors duration-200
">
  <option>Select option</option>
</select>
```

### 3.4 Navigation

#### Top Navigation
```tsx
<nav className="bg-white border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <img src="/sevensa_logo.png" alt="Sevensa" className="h-8" />
      </div>
      <div className="flex items-center space-x-4">
        {/* Nav items */}
      </div>
    </div>
  </div>
</nav>
```

#### Sidebar Navigation
```tsx
<aside className="w-64 bg-sevensa-dark h-screen">
  <div className="p-6">
    <img src="/sevensa_logo_white.png" alt="Sevensa" className="h-8" />
  </div>
  <nav className="px-4 space-y-2">
    <a href="#" className="
      flex items-center px-4 py-3
      text-white/80 hover:text-white hover:bg-white/10
      rounded-lg transition-colors duration-200
    ">
      Dashboard
    </a>
  </nav>
</aside>
```

### 3.5 Data Display

#### Table
```tsx
<table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-bold text-sevensa-dark uppercase tracking-wider">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-900">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

#### Badge
```tsx
<span className="
  inline-flex items-center
  px-3 py-1
  rounded-full
  text-xs font-semibold
  bg-sevensa-teal/10 text-sevensa-teal
">
  Status
</span>
```

---

## 4. Layout Patterns

### 4.1 Dashboard Layout
```
┌─────────────────────────────────────────────┐
│  Header (Logo, Navigation, User Menu)      │
├────────┬────────────────────────────────────┤
│        │                                    │
│ Sidebar│  Main Content Area                 │
│  Nav   │  - Page Header                     │
│        │  - Stats Cards (4-column grid)     │
│        │  - Charts & Tables                 │
│        │  - Action Cards                    │
│        │                                    │
└────────┴────────────────────────────────────┘
```

### 4.2 Form Layout
```
┌─────────────────────────────────────────────┐
│  Form Header                                │
├─────────────────────────────────────────────┤
│                                             │
│  Form Section 1                             │
│  ├─ Field Group 1 (2-column)                │
│  ├─ Field Group 2 (1-column)                │
│  └─ Field Group 3 (3-column)                │
│                                             │
│  Form Section 2                             │
│  └─ ...                                     │
│                                             │
│  ┌───────────┐  ┌───────────┐              │
│  │  Cancel   │  │  Submit   │              │
│  └───────────┘  └───────────┘              │
└─────────────────────────────────────────────┘
```

---

## 5. Iconography System

### 5.1 Icon Library
**Recommended:** Lucide React (already in dependencies)
- Style: Outline icons (matches brand guide)
- Consistent stroke width: 2px
- Default size: 20px (w-5 h-5)

### 5.2 Icon Color Usage
```tsx
// Primary actions
<Icon className="w-5 h-5 text-sevensa-teal" />

// Secondary/muted
<Icon className="w-5 h-5 text-gray-500" />

// On dark background
<Icon className="w-5 h-5 text-white" />

// Status icons
<CheckCircle className="w-5 h-5 text-success" />
<XCircle className="w-5 h-5 text-error" />
<AlertCircle className="w-5 h-5 text-warning" />
```

---

## 6. Dark Mode Implementation (+1 Feature)

### 6.1 Dark Mode Color System
```typescript
const darkColors = {
  bg: {
    base: '#0F1419',      // Deep dark
    surface: '#1A1F26',   // Elevated surface
    muted: '#242A33',     // Muted surface
    hover: '#2E3740',     // Hover state
  },

  text: {
    primary: '#F8F9FA',   // High contrast
    secondary: '#ADB5BD',  // Medium contrast
    muted: '#6C757D',     // Low contrast
  },

  // Brand colors remain consistent
  'sevensa-teal': '#00A896',  // Slightly lighter for dark
  'sevensa-dark': '#E9ECEF',  // Inverted for text
}
```

### 6.2 Dark Mode Toggle Component
```tsx
<button
  onClick={toggleDarkMode}
  className="
    p-2 rounded-lg
    bg-gray-100 dark:bg-gray-800
    text-gray-800 dark:text-gray-100
    hover:bg-gray-200 dark:hover:bg-gray-700
    transition-colors duration-200
  "
>
  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
</button>
```

### 6.3 Implementation Strategy
1. Add `dark:` variants to all Tailwind classes
2. Use CSS custom properties for dynamic theme switching
3. Store preference in localStorage
4. Respect system preference (`prefers-color-scheme`)

---

## 7. Animation & Interaction

### 7.1 Transition Standards
```css
/* Default transitions */
transition: all 200ms ease-in-out;

/* Specific properties */
transition-colors: 200ms ease-in-out;
transition-transform: 300ms cubic-bezier(0.4, 0, 0.2, 1);
transition-opacity: 150ms ease-in-out;
```

### 7.2 Micro-interactions
- **Hover:** Subtle color shift + shadow elevation
- **Click:** Scale down to 0.98 + immediate feedback
- **Loading:** Skeleton screens with shimmer effect
- **Success:** Green checkmark with bounce animation
- **Error:** Red shake animation + clear message

---

## 8. Responsive Design

### 8.1 Breakpoints
```typescript
screens: {
  'sm': '640px',   // Mobile large
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Desktop large
  '2xl': '1536px', // Desktop XL
}
```

### 8.2 Mobile-First Approach
```tsx
<div className="
  px-4 sm:px-6 lg:px-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
  gap-4 md:gap-6
">
  {/* Content adapts to screen size */}
</div>
```

---

## 9. Accessibility (WCAG 2.1 AA)

### 9.1 Color Contrast
- Text on light background: Minimum 4.5:1 ratio
- Text on dark background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio

### 9.2 Focus States
```css
focus:outline-none
focus:ring-2
focus:ring-sevensa-teal
focus:ring-offset-2
```

### 9.3 Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order
- Skip navigation link for main content
- Escape key closes modals/dropdowns

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Day 1)
- [ ] Setup Tailwind config with Sevensa tokens
- [ ] Import Montserrat font
- [ ] Add logo assets to /public
- [ ] Create base CSS variables for theming
- [ ] Setup dark mode infrastructure

### Phase 2: Core Components (Day 2)
- [ ] Button system
- [ ] Form elements
- [ ] Card system
- [ ] Navigation components
- [ ] Badge & status indicators

### Phase 3: Layout & Pages (Day 3)
- [ ] Update app shell/layout
- [ ] Home page rebrand
- [ ] Dashboard (Suus) rebrand
- [ ] CFO dashboard rebrand
- [ ] Supplier portal rebrand

### Phase 4: Data Visualization (Day 4)
- [ ] Chart color schemes
- [ ] Table styling
- [ ] Data card components
- [ ] KPI visualizations

### Phase 5: Polish & Testing (Day 5)
- [ ] Animation refinements
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Documentation

---

## 11. Quality Checklist

### Visual Consistency
- [ ] All colors match brand guide
- [ ] Typography uses Montserrat
- [ ] Logo placement follows spacing rules
- [ ] Shadows are consistent
- [ ] Border radius is consistent

### Interaction
- [ ] All buttons have hover states
- [ ] All links have focus states
- [ ] Loading states are clear
- [ ] Error states are helpful
- [ ] Success feedback is immediate

### Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

### Performance
- [ ] Images are optimized
- [ ] Fonts are preloaded
- [ ] CSS is minified
- [ ] JavaScript is tree-shaken
- [ ] Lighthouse score > 90

---

## 12. Brand Voice in UI Copy

### 12.1 Microcopy Examples

**Before (Generic):**
> "Submit Form"

**After (Sevensa Voice):**
> "Start Your Assessment"

**Before (Technical):**
> "Error: Invalid input"

**After (Helpful):**
> "Let's check that again - the format should be XX-XXXX-XX"

**Before (Formal):**
> "Your request has been processed successfully."

**After (Warm):**
> "Great! We're processing your request and will update you shortly."

### 12.2 Empty States
```tsx
<div className="text-center py-12">
  <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-sevensa-dark mb-2">
    No assessments yet
  </h3>
  <p className="text-gray-600 mb-6">
    Ready to get started? Create your first LTSD assessment.
  </p>
  <button className="btn-primary">
    Create Assessment
  </button>
</div>
```

---

## Conclusion

This comprehensive design system ensures that every pixel of the PSRA-LTSD application reflects the Sevensa brand identity. By following these guidelines, we create a cohesive, professional, and user-friendly experience that embodies the values of **Intelligence, Precision, and Partnership**.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1 implementation
3. Establish design review cadence
4. Set up component library in Storybook (optional)
5. Create brand compliance checklist for new features

---

**Document Prepared By:** Claude (Manus AI)
**For:** Sevensa PSRA-LTSD Enterprise v2
**Last Updated:** 13 oktober 2025
