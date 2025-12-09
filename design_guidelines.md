# Mobile Library App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app has explicit user accounts with role-based access (students and lecturers).

**Implementation:**
- SSO-based authentication with Apple Sign-In (iOS) and Google Sign-In
- Login flow includes role selection screen immediately after successful authentication
- Role selection presents two clear options: "I'm a Student" and "I'm a Lecturer"
- Include privacy policy and terms of service links on login screen
- Account management screen includes log out and delete account (nested under Settings > Account > Delete with double confirmation)

### Navigation Structure

**Information Architecture:**
- **Students:** 4 distinct feature areas (Home/Dashboard, Live Classroom, Documents, Profile)
- **Lecturers:** 3 distinct feature areas (Dashboard, Upload, Live Classroom)

**Root Navigation:**
- **Student Portal:** Tab Navigation with 4 tabs + Floating Action Button for quick document access
  - Tabs: Home, Classroom, Documents, Profile
  - FAB: Quick upload/scan notes
- **Lecturer Portal:** Tab Navigation with 3 tabs
  - Tabs: Dashboard, Upload, Classroom

**Onboarding Flow (Students Only):**
- Post-authentication, linear course selection flow (stack-only)
- Single screen with search and category-filtered course list
- Multi-select capability with "Continue" button

## Screen Specifications

### 1. Login Screen (Stack-Only)
- **Purpose:** Authenticate users via SSO
- **Layout:**
  - No header (full-screen branded experience)
  - Centered content area with app logo, tagline, and auth buttons
  - Footer with privacy/terms links
- **Components:** Logo image, SSO buttons (Apple, Google), legal links
- **Safe Area:** Top: insets.top + 60px, Bottom: insets.bottom + 40px

### 2. Role Selection Screen (Stack-Only)
- **Purpose:** User selects student or lecturer role
- **Layout:**
  - Custom header with "Welcome" title and skip option (right button for users who already selected)
  - Two large card buttons with icons and descriptions
  - Non-scrollable centered layout
- **Components:** Icon cards with role descriptions
- **Safe Area:** Top: headerHeight + 24px, Bottom: insets.bottom + 24px

### 3. Course Selection Screen (Stack-Only, Students)
- **Purpose:** Students select their enrolled courses
- **Layout:**
  - Default navigation header with "Select Your Courses" title
  - Search bar below header
  - Scrollable list of course cards with checkboxes
  - Fixed "Continue" button at bottom
- **Components:** Search bar, selectable course cards, floating continue button
- **Safe Area:** Top: headerHeight + 16px, Bottom: insets.bottom + 80px

### 4. Student Home/Dashboard (Tab: Home)
- **Purpose:** Overview of student's academic life
- **Layout:**
  - Transparent header with greeting and notification icon (right)
  - Scrollable content with fitness-inspired cards
  - Progress rings for study goals
  - Quick action cards for courses, upcoming deadlines
- **Components:** Welcome banner, progress rings, course cards, study streak indicator, upcoming schedule widget
- **Safe Area:** Top: headerHeight + 16px, Bottom: tabBarHeight + 16px

### 5. Student Profile (Tab: Profile)
- **Purpose:** Personal academic information and settings
- **Layout:**
  - Default header with "Profile" title and settings gear (right)
  - Scrollable content
  - Sections: Avatar/Name, My Courses, My Notes, Papers, Study Timetable, Study Goals
- **Components:** Avatar picker, section headers, list items with navigation arrows, progress bars for goals
- **Safe Area:** Top: headerHeight + 16px, Bottom: tabBarHeight + 16px

### 6. Live Classroom (Tab: Classroom, Both Roles)
- **Purpose:** Join or start live teaching sessions
- **Layout:**
  - Custom header with class name and participant count (right)
  - Full-screen video area
  - Floating controls overlay (bottom)
- **Components:** Video grid, mic/camera toggles, chat button, screen share toggle (lecturer only), leave button
- **Safe Area:** Floating controls bottom: insets.bottom + 16px

### 7. Documents (Tab: Documents, Students)
- **Purpose:** Browse and view course materials
- **Layout:**
  - Default header with "Documents" title and search icon (right)
  - Scrollable list grouped by course
  - Filter chips below header
- **Components:** Search bar (modal), filter chips, document list items with file type icons and metadata
- **Safe Area:** Top: headerHeight + 16px, Bottom: tabBarHeight + 16px

### 8. Document Viewer (Modal)
- **Purpose:** In-app PDF/Word document viewing
- **Layout:**
  - Custom header with document name, page counter, and close button (left)
  - Full-screen scrollable document viewer
  - Floating toolbar (bottom) with zoom, annotations, share
- **Components:** PDF/document renderer, zoom controls, annotation tools, share button
- **Safe Area:** Top: headerHeight, Bottom: insets.bottom + 60px (for toolbar)

### 9. Lecturer Dashboard (Tab: Dashboard)
- **Purpose:** Overview of teaching materials and classes
- **Layout:**
  - Transparent header with "My Courses" title and add course button (right)
  - Scrollable content with course cards
  - Statistics cards showing uploaded notes count, active students, upcoming classes
- **Components:** Stats widgets, course cards with action buttons, recent activity feed
- **Safe Area:** Top: headerHeight + 16px, Bottom: tabBarHeight + 16px

### 10. Upload Notes (Tab: Upload, Lecturers)
- **Purpose:** Upload teaching materials
- **Layout:**
  - Default header with "Upload Material" title and help icon (right)
  - Scrollable form
  - Submit button below form (not in header)
- **Components:** File picker, course selector dropdown, title input, description textarea, tags input, visibility toggle, submit button
- **Safe Area:** Top: headerHeight + 16px, Bottom: insets.bottom + 24px

## Design System

### Color Palette (Fitness-Inspired Professional)
- **Primary:** Vibrant Blue (#2563EB) - energy and trust
- **Secondary:** Energetic Purple (#7C3AED) - motivation
- **Accent:** Fresh Teal (#14B8A6) - progress/success
- **Success:** Mint Green (#10B981)
- **Warning:** Warm Orange (#F59E0B)
- **Error:** Bold Red (#EF4444)
- **Neutrals:**
  - Background: Clean White (#FFFFFF)
  - Surface: Light Gray (#F9FAFB)
  - Text Primary: Deep Charcoal (#111827)
  - Text Secondary: Slate (#6B7280)
  - Border: Soft Gray (#E5E7EB)

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto Bold (Android)
  - H1: 32px, Bold, 38px line height
  - H2: 24px, Semibold, 30px line height
  - H3: 20px, Semibold, 26px line height
- **Body:** SF Pro Text (iOS) / Roboto Regular (Android)
  - Body: 16px, Regular, 24px line height
  - Small: 14px, Regular, 20px line height
  - Caption: 12px, Regular, 16px line height

### Visual Design Principles

**Cards & Surfaces:**
- Use elevated cards with subtle shadows for content grouping
- Card shadow: offset (0, 1), opacity 0.05, radius 3
- Border radius: 12px for cards, 8px for buttons
- Fitness-inspired: gradient overlays on hero sections (Primary to Secondary, 45deg, 0.9 to 0.7 opacity)

**Progress Indicators:**
- Circular progress rings (fitness style) for study goals
- Use gradient fills (Primary to Accent) for completed portions
- Animate progress changes with spring animations
- Show percentage text in ring center

**Touchable Feedback:**
- All buttons scale down slightly (0.95) on press with spring animation
- List items: subtle background color change on press (#F3F4F6)
- Tab icons: scale up (1.1) when active with color transition

**Floating Action Button (Student Portal):**
- Position: bottom-right, 16px from edges
- Shadow specifications:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- Gradient background (Primary to Secondary)
- Icon: Plus or Upload (Feather icons)

**Icons:**
- Use Feather icons from @expo/vector-icons exclusively
- Icon sizes: 24px (default), 20px (tabs), 16px (inline)
- Never use emojis

### Document Viewer Design
- Clean white background for document content
- Floating semi-transparent toolbar with blur effect
- Page transition: smooth vertical scroll
- Zoom: pinch gesture support with min 1x, max 3x
- Annotation colors: match app accent colors

### Accessibility Requirements
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 for text, 3:1 for large text
- Screen reader labels for all interactive elements
- Support Dynamic Type scaling
- Keyboard navigation for forms
- Focus indicators visible on all interactive elements

### Critical Assets
1. **App Logo:** Modern book/library icon with gradient (Primary to Secondary)
2. **Role Icons:** Student icon (graduation cap), Lecturer icon (presentation/podium)
3. **Empty States:** Illustrations for no documents, no courses, no notes (minimal line art style)
4. **Course Category Icons:** 8-10 subject icons (Science beaker, Math symbols, Literature book, etc.)
5. **User Avatars:** 6 preset avatars in academic theme (minimalist geometric designs with app color palette)