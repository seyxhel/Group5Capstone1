# 📊 Reports Design Guide

## Overview
This document outlines the design specifications, layout structure, and visual guidelines for the Coordinator Admin Reports pages in the ticketing system.

---

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#3b82f6` - Main interactive elements
- **Success Green**: `#16a34a` - Positive metrics, met SLA
- **Warning Orange**: `#f59e0b` - Caution, due soon
- **Danger Red**: `#dc2626` - Critical, overdue
- **Dark Red**: `#991b1b` - Critical priority, breached SLA
- **Gray Scale**: 
  - Text: `#1e293b` (dark), `#64748b` (medium), `#475569` (labels)
  - Backgrounds: `#f8fafc` (light), `#e2e8f0` (borders)

### Typography
- **Page Title**: 2rem, bold (700), color `#1e293b`
- **Section Title**: 1.25rem, bold (700)
- **Chart Title**: 1.1rem, semi-bold (600)
- **Stat Value**: 2rem, bold (700)
- **Stat Label**: 0.85rem, medium (500), color `#64748b`
- **Body Text**: 0.9-0.95rem, regular (400)

### Spacing
- **Page Padding**: 24px (desktop), 16px (mobile)
- **Card Padding**: 24-28px
- **Grid Gap**: 20-24px
- **Element Gap**: 16px (default), 8px (tight), 32px (sections)

### Border Radius
- **Cards**: 12px
- **Buttons/Selects**: 6px
- **Badges**: 6px
- **Icons**: 12px

---

## 📄 Page 1: Ticket Reports (`/admin/reports/tickets`)

### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Ticket Reports                                          │
│  Comprehensive ticket analytics and performance metrics     │
├─────────────────────────────────────────────────────────────┤
│  [Date Range: ▼]  [Category: ▼]                            │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ 📊 45  │  │ 🔄 12  │  │ ✅ 28  │  │ 🎯 5   │          │
│  │ Total  │  │ Open   │  │Resolved│  │ Closed │          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Status Distribution │  │ Priority Breakdown  │         │
│  │    [PIE CHART]     │  │    [BAR CHART]      │         │
│  │                     │  │                     │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ Tickets by Category │  │ Ticket Trends       │         │
│  │    [BAR CHART]     │  │    [LINE CHART]     │         │
│  │                     │  │                     │         │
│  └─────────────────────┘  └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Page Header
- **Layout**: Stacked vertically, left-aligned
- **Title**: Large emoji icon + text
- **Subtitle**: Gray text below title, descriptive
- **Margin Bottom**: 32px

#### 2. Filters Section
- **Layout**: Horizontal flex row with wrap
- **Components**: 
  - Label (semi-bold) + Select dropdown
  - Each filter group has 8px gap
  - 16px gap between filter groups
- **Select Styling**:
  - White background, border `#e2e8f0`
  - Hover: border changes to `#3b82f6`
  - Focus: blue shadow with border highlight
  - Min-width: 160px

#### 3. Summary Stats Cards
- **Grid**: Auto-fit, minimum 240px per card
- **Card Design**:
  - White background, rounded corners (12px)
  - Box shadow: subtle `0 1px 3px rgba(0,0,0,0.1)`
  - Hover: lift effect `-2px` + stronger shadow
  - Padding: 24px
- **Card Content**:
  - Icon (2rem) in colored circle (56x56px)
  - Value: Large number (2rem, bold)
  - Label: Small gray text below value
- **Layout**: Horizontal flex with 16px gap

#### 4. Charts Section
- **Grid**: 2 columns on desktop, 1 on mobile/tablet
- **Minimum Width**: 450px per chart card
- **Chart Card**:
  - White background, 12px border radius
  - Padding: 24px
  - Title above chart (1.1rem, semi-bold)
  - Chart container: 350px height
- **Chart Types**:
  1. **Status Distribution**: Pie chart with legend at bottom
  2. **Priority Breakdown**: Bar chart (Critical/High/Medium/Low/Not Set)
  3. **Tickets by Category**: Horizontal bar chart
  4. **Ticket Trends**: Line chart showing created vs resolved over time

### Visual Specifications

#### Status Colors (Pie Chart)
- New: `#2563eb` (Blue)
- Open: `#0284c7` (Cyan)
- In Progress: `#7c3aed` (Purple)
- On Hold: `#b35000` (Brown)
- Resolved: `#059669` (Green)
- Closed: `#16a34a` (Dark Green)
- Rejected: `#dc2626` (Red)
- Withdrawn: `#6b7280` (Gray)

#### Priority Colors (Bar Chart)
- Critical: `#991b1b` (Dark Red)
- High: `#dc2626` (Red)
- Medium: `#d97706` (Orange)
- Low: `#16a34a` (Green)
- Not Set: `#6b7280` (Gray)

---

## ⏱️ Page 2: SLA Compliance (`/admin/reports/sla`)

### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ⏱️ SLA Compliance                                          │
│  Service Level Agreement performance tracking and metrics   │
├─────────────────────────────────────────────────────────────┤
│  [Date Range: ▼]  [Priority: ▼]                            │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ 📋 42  │  │ ✅ 35  │  │ ⚠️ 4   │  │ 🎯 83.3%│          │
│  │ Total  │  │On Track│  │Due Soon│  │Complianc│          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🔴 SLA VIOLATIONS                                     │ │
│  │ 3  3 currently overdue, 0 breached on closure        │ │
│  └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ SLA Status Overview │  │ SLA Compliance by   │         │
│  │    [PIE CHART]     │  │ Priority            │         │
│  │                     │  │  [GROUPED BAR]      │         │
│  └─────────────────────┘  └─────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  📖 SLA Response Time Guidelines                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │[Critical]│ │  [High]  │ │ [Medium] │ │  [Low]   │    │
│  │ 4 hours  │ │ 8 hours  │ │24 hours  │ │48 hours  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Summary Stats Cards (Same as Ticket Reports)
- **Different Metrics**:
  - Total Tickets (with SLA)
  - On Track/Met (green value)
  - Due Soon (orange value)
  - Compliance Rate % (blue value)

#### 2. SLA Violations Alert
- **Layout**: Full-width card with red left border (4px)
- **Design**:
  - Large icon (2.5rem) on left
  - Big red number (2.5rem, bold)
  - Bold label below number
  - Small gray subtext with breakdown
- **Background**: White with red accent
- **Border**: Red left border
- **Margin**: 32px bottom

#### 3. Charts Section
- **Chart 1: SLA Status Overview (Pie)**
  - Met SLA: `#16a34a` (Green)
  - On Time: `#3b82f6` (Blue)
  - Due Soon: `#f59e0b` (Orange)
  - Overdue: `#dc2626` (Red)
  - Breached: `#991b1b` (Dark Red)

- **Chart 2: SLA Compliance by Priority (Grouped Bar)**
  - Two datasets: Met SLA (green) vs Breached SLA (red)
  - X-axis: Critical, High, Medium, Low
  - Shows comparison side-by-side

#### 4. SLA Guidelines Card
- **Design**: White card with padding 28px
- **Title**: Section title with emoji
- **Grid**: 4 columns on desktop, 1 on mobile
- **Guideline Item**:
  - Gray background (`#f8fafc`)
  - Border: `#e2e8f0`
  - Border radius: 8px
  - Padding: 16px 20px
  - Flex layout: badge on left, time on right
- **Priority Badge**:
  - Colored background matching priority
  - White text, uppercase, bold
  - 6px border radius
  - Small padding (6px 14px)
- **Time Display**: Bold, dark gray

### SLA Status Definitions

| Status | Color | Description |
|--------|-------|-------------|
| Met | Green `#16a34a` | Ticket resolved within SLA time |
| On Time | Blue `#3b82f6` | Active ticket, still within SLA |
| Due Soon | Orange `#f59e0b` | < 20% of SLA time remaining |
| Overdue | Red `#dc2626` | Active ticket past SLA deadline |
| Breached | Dark Red `#991b1b` | Resolved past SLA deadline |
| N/A | Gray `#6b7280` | No priority set |

### SLA Time Limits

| Priority | Time Limit | Color |
|----------|-----------|-------|
| Critical | 4 hours | `#991b1b` |
| High | 8 hours | `#dc2626` |
| Medium | 24 hours | `#d97706` |
| Low | 48 hours | `#16a34a` |

---

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 1024px - Full 2-column layout
- **Tablet**: 768px - 1024px - 1 column for charts
- **Mobile**: < 768px - Full mobile optimization

### Mobile Adaptations
1. **Page Padding**: Reduce from 24px to 16px
2. **Page Title**: Reduce from 2rem to 1.5rem
3. **Stats Grid**: Stack to 1 column
4. **Filters**: Stack vertically, full width
5. **Charts**: Single column, reduce height to 300px
6. **Guidelines**: Stack to 1 column
7. **Font Sizes**: Slightly reduce for better fit

---

## 🎯 Chart Specifications

### Common Chart Options
- **Responsive**: `true`
- **Maintain Aspect Ratio**: `false`
- **Legend Position**: Bottom for pie, top for bar/line
- **Legend Padding**: 15px
- **Point Style**: Use point style for cleaner legends
- **Tooltip**: Show percentage for pie charts

### Pie Chart Specifics
- **Border Width**: 2px
- **Border Color**: White
- **Hover**: Subtle scale effect
- **Data Labels**: Show in tooltips, not on chart

### Bar Chart Specifics
- **Border Radius**: 6px
- **Y-axis**: Begin at zero
- **Step Size**: 1 (whole numbers)
- **Grid Lines**: Light gray

### Line Chart Specifics
- **Tension**: 0.4 (smooth curves)
- **Fill**: Subtle transparent background
- **Point Radius**: 4px
- **Line Width**: 2px

---

## 🔄 Interactive Features

### Filters
- **Date Range Options**:
  - All Time (default)
  - Last 7 Days
  - Last 30 Days
  - Last 90 Days

- **Category Filter** (Ticket Reports):
  - All Categories (default)
  - Dynamic list from ticket data

- **Priority Filter** (SLA Reports):
  - All Priorities (default)
  - Critical (4h)
  - High (8h)
  - Medium (24h)
  - Low (48h)

### Hover Effects
- **Cards**: Lift 2px up + enhance shadow
- **Selects**: Border color change to blue
- **Chart Elements**: Show detailed tooltips

### Tooltips
- **Pie Charts**: Show count + percentage
- **Bar Charts**: Show exact count
- **Line Charts**: Show value for each dataset

---

## 📊 Data Calculations

### Ticket Reports
1. **Total Tickets**: Count all filtered tickets
2. **Open Tickets**: Status = New, Open, In Progress
3. **Resolved**: Status = Resolved
4. **Closed**: Status = Closed
5. **Status Distribution**: Count by each status
6. **Priority Breakdown**: Count by priority level
7. **Category Breakdown**: Count by category

### SLA Reports
1. **SLA Status Calculation**:
   - Get ticket creation time
   - Calculate hours elapsed
   - Compare to SLA limit for priority
   - Determine status (Met/On Time/Due Soon/Overdue/Breached)

2. **Compliance Rate**:
   - (Met + On Time) / Total × 100

3. **Due Soon Threshold**:
   - Remaining time ≤ 20% of SLA limit

4. **Active vs Resolved**:
   - Active: Check current elapsed time
   - Resolved: Check resolution time

---

## 💡 Best Practices

### Performance
- Use `useMemo` for expensive calculations
- Filter data once, reuse for multiple charts
- Lazy load charts if needed

### Accessibility
- Use semantic HTML structure
- Provide alt text for chart icons
- Ensure sufficient color contrast
- Support keyboard navigation

### Data Handling
- Handle empty states gracefully
- Show "No data" messages when appropriate
- Validate data before charting
- Handle missing/null values

### Visual Hierarchy
1. Page title and filters (top)
2. Summary stats (quick overview)
3. Alert/violation section (attention)
4. Detailed charts (analysis)
5. Reference information (guidelines)

---

## 🎨 Example Mockups

### Ticket Reports - Summary Stats
```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│      📊            │  │      🔄            │  │      ✅            │
│                    │  │                    │  │                    │
│       45           │  │       12           │  │       28           │
│   Total Tickets    │  │   Open Tickets     │  │     Resolved       │
└────────────────────┘  └────────────────────┘  └────────────────────┘
     White card             White card             White card
   Shadow on hover       Shadow on hover       Shadow on hover
```

### SLA Compliance - Alert Card
```
┌─────────────────────────────────────────────────────────────┐
│ │  🔴                                                        │
│ │                                                            │
│ │     3                                                      │
│ │     SLA Violations                                         │
│ │     3 currently overdue, 0 breached on closure            │
│ │                                                            │
└─────────────────────────────────────────────────────────────┘
  ↑ Red left border (4px)
```

---

## 🚀 Implementation Notes

### Required Libraries
- `react-chartjs-2` - React wrapper for Chart.js
- `chart.js` - Charting library
- Register required components:
  - ArcElement (pie)
  - CategoryScale (x-axis)
  - LinearScale (y-axis)
  - BarElement (bar)
  - PointElement (line points)
  - LineElement (line)
  - Title, Tooltip, Legend

### File Structure
```
coordinator-admin/
  pages/
    reports/
      CoordinatorAdminTicketReports.jsx
      CoordinatorAdminSLAReports.jsx
      CoordinatorAdminReports.module.css
```

### Routes
- `/admin/reports/tickets` → Ticket Reports
- `/admin/reports/sla` → SLA Compliance

### Navigation
- Reports dropdown in navbar
- Two items: "Ticket Reports" and "SLA Compliance"
- Active state highlighting

---

## 📝 Future Enhancements

### Potential Features
1. **Export to PDF/Excel** - Download reports
2. **Custom Date Range** - Date picker for specific ranges
3. **Scheduled Reports** - Email automated reports
4. **Comparison Mode** - Compare time periods
5. **Drill-down** - Click chart to see ticket list
6. **Real-time Updates** - Live data refresh
7. **More Chart Types** - Heat maps, funnel charts
8. **Advanced Filters** - Multi-select, ranges
9. **Saved Views** - Save filter combinations
10. **Print-friendly** - Optimized print layout

---

## ✅ Checklist for Implementation

- [x] Create Ticket Reports page component
- [x] Create SLA Compliance page component
- [x] Create shared CSS module
- [x] Implement date range filtering
- [x] Implement category/priority filtering
- [x] Add summary stat cards
- [x] Implement Status Distribution chart
- [x] Implement Priority Breakdown chart
- [x] Implement Category Breakdown chart
- [x] Implement Ticket Trends chart
- [x] Calculate SLA metrics
- [x] Implement SLA Overview chart
- [x] Implement SLA by Priority chart
- [x] Add SLA violations alert
- [x] Add SLA guidelines reference
- [x] Configure routes
- [x] Update navbar dropdown
- [x] Test responsive design
- [x] Verify data calculations
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Accessibility audit

---

**Document Version**: 1.0  
**Last Updated**: October 7, 2025  
**Author**: Development Team  
**Status**: Implementation Complete
