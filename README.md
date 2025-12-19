# Arts&Ideas Digital Calendar

A responsive event calendar platform built for the University of Tampa College of Arts & Letters, translating the Arts&Ideas print publication's identity to an interactive digital experience with auto-updating content and custom calendar logic.

## Overview

Arts & Ideas, the University of Tampa College of Arts & Letters' annual print publication, needed a digital presence to make event information more accessible throughout the academic year. Working with the publication's designer, I built a responsive web platform that preserves the publication's visual identity while adding interactive features like auto-updating upcoming events, dual calendar views (list and grid), and mobile-optimized layouts.

### Key Features

- Auto-updating upcoming events showcase
- Custom calendar grid with dual view modes: list and calendar
- Mobile-optimized responsive layouts
- Real-time past event filtering
- Smart month navigation skipping empty periods
- Interactive day details with event popovers (for desktop) or expanded cards (for mobile)

## Live Demo

[https://arts-ideas.vercel.app/](https://arts-ideas.vercel.app/)

## Tech Stack

**Frontend:**
- React.js
- React Router
- CSS

**Backend:**
- Node.js
- Express.js

**Database:**
- Supabase (PostgreSQL)
- Cloudinary (image optimization)

**Services:**
- JWT Authentication
- Resend API (email notifications)

**Tools:**
- Vercel (frontend)
- Railway (backend)
- Git & GitHub
- Figma (UI/UX design)
- GitHub Issues (project management)

## Key Features Explained

### Auto-Updating Featured Events

- Dynamic showcase automatically surfaces the next three upcoming events from the database
- Updates in real-time as events pass without manual intervention
- Curated thematic images with complete event details
- Maintains publication's distinctive visual layout and typography
- Database queries filter for future dates and sort chronologically

### Custom Calendar Grid with Automatic Date Calculation

- Fully custom calendar built with CSS Grid and JavaScript
- Automatic calculation of starting day for each month (accounting for day of week)
- Accounts for varying month lengths and leap years
- Days with events show time, title of first event, and count of additional events (e.g., "+2 more")
- Click any day with events to view complete details in popover

### Dual View System

- Two distinct visualization modes: list view and calendar grid view
- View selection persists across month navigation
- **List View:** Publication-style cards with full event details (title, date, time, location, description), inspired by the publication's original layout
- **Calendar View:** Month grid with event indicators and expandable day cells
- Users can toggle between views while maintaining the current month position

### Smart Month Navigation with Event Filtering

- Navigation displays only months containing events
- Automatically skips empty periods (e.g., summer break)
- Click through months with dynamic data loading
- "Hide Past Events" toggle for current month, particularly useful on mobile devices to reduce scroll length
- Filters out past events based on real-time date comparison

### Responsive Design

- Significantly transformed layouts for mobile devices
- Calendar shifts from seven-column grid to single-column layout
- Each date occupies full row for easier tapping and reading
- Featured event cards stack vertically with adjusted image sizing
- Days with multiple events display all events simultaneously
- Empty date ranges collapse with visual indicators ("...") to minimize scrolling

## Planned Improvements

- [ ] Interactive Campus Map: Visual building locator following the publication's aesthetic to help visitors navigate to event locations
- [ ] Search Functionality: Full-text search across event titles and descriptions
- [ ] Category Filtering: Filter events by type (exhibition, performance, lecture, workshop)
- [ ] Event Reminders: Allow users to save events and receive notifications
- [ ] Admin Dashboard: Content management interface for updating events without accessing the database directly

## Contributing

This is a private project for the University of Tampa. For questions or suggestions, please contact the repository owner.

## 📄 License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

---

**Built by:** Maria Blokhina

**Contact:** blokhinamariyayu@gmail.com

**Portfolio:** https://mariablokhina.framer.website/
