# Feature Specification: PICKLEPOCK Core Application

**Feature Branch**: `001-core-application`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User description: "Application Web & Mobile de mise en relation pour le Pickleball. Stack: React + Tailwind CSS + Supabase. Design: Thème clair, accents Vert Sport et Bleu Clair. Interface Mobile-First. Navigation à 5 onglets (Profil, Accueil, Matchs, Classement, Clubs)."

## User Scenarios & Testing

### User Story 1 - Navigation and Global Layout (Priority: P1)

As a user, I want a clear and responsive mobile-first interface with a bottom navigation bar so I can easily switch between the main sections of the app.

**Why this priority**: Essential for the core user experience and "Clash Royale" style feel.

**Independent Test**: Can be tested by navigating between the 5 tabs and verifying the active state and content change.

**Acceptance Scenarios**:

1. **Given** the app is loaded, **When** I click on any of the 5 icons in the bottom nav, **Then** I am taken to the corresponding page (Profil, Accueil, Matchs, Classement, Clubs).
2. **Given** a mobile device screen size, **When** I view the app, **Then** the navigation is fixed at the bottom and items are properly spaced.

---

### User Story 2 - Match and Tournament Listing (Priority: P2)

As a player, I want to see a list of available matches and be able to toggle to see upcoming tournaments.

**Why this priority**: Core value proposition of the app.

**Independent Test**: Can be tested by switching the toggle on the "Matchs" tab and seeing the list change from matches to tournaments.

**Acceptance Scenarios**:

1. **Given** I am on the "Matchs" tab, **When** I click the "Matchs/Tournois" toggle, **Then** the view switches between friendlies and competitive tournaments.

---

### User Story 3 - Regional and Global Rankings (Priority: P3)

As a competitive player, I want to see rankings filtered by gender and region.

**Why this priority**: Drives engagement and social competition.

**Acceptance Scenarios**:

1. **Given** I am on the "Classement" tab, **When** I apply a region filter, **Then** only players from that region are shown in the ranked list.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a responsive Bottom Navigation with 5 tabs: Profil, Accueil, Matchs, Classement, Clubs.
- **FR-002**: System MUST use Supabase for authentication and profile storage.
- **FR-003**: System MUST display a toggle between "Matchs" and "Tournois" in the Matchs view.
- **FR-004**: System MUST display an interactive map in the "Clubs" view showing club locations.
- **FR-005**: System MUST implement a dynamic ranking system based on game results stored in Supabase.

### Success Criteria

- **SC-001**: Page transitions between navigation tabs MUST be under 100ms.
- **SC-002**: Database queries for rankings MUST handle pagination correctly for large datasets.
- **SC-003**: UI MUST pass accessibility checks for color contrast (Sport Green/White).
