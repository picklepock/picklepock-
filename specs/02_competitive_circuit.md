# Feature Specification: PICKLEPOCK - Circuit Compétitif

**Feature Branch**: `002-competitive-circuit`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User vision & objectives for "Circuit Compétitif".

## 1. Vision & Objectifs
PicklePock vise à structurer la pratique amateur via trois piliers :
- **Structurer la compétition** : Classement Elo/Points simple et lisible par saison.
- **Développer les clubs** : Outils d'organisation et de gestion de tournois.
- **Fédérer la communauté** : Matchs amicaux et carte interactive.

## 2. Utilisateurs Cibles
- **Le Joueur Amateur** : Veut progresser, voir son rang et trouver des partenaires.
- **Le Club** : Veut de la visibilité et des outils de gestion d'événements/inscriptions.

## 3. User Scenarios & Testing

### User Story 1 - Competitive Ranking (Priority: P1)
As a competitive player, I want to see my dynamic ranking (Elo/Points) at regional and global levels so I can track my progress.

**Acceptance Scenarios**:
1. **Given** I am on the Ranking tab, **When** I filter by "Regional" and "H/F", **Then** the list shows players sorted by points in that specific category/region.

---

### User Story 2 - Club Tournament Management (Priority: P2)
As a club manager, I want to create an annual tournament schedule and manage registrations easily.

**Acceptance Scenarios**:
1. **Given** the club interface, **When** I create a tournament, **Then** it appears on the public "Tournaments" list (Matches tab toggle).
2. **Given** a list of registered players, **When** the tournament starts, **Then** the system generates an automatic matching table (tirage au sort).

---

### User Story 3 - Interactive Map (Priority: P3)
As a player, I want to see available clubs and terrains on an interactive map.

**Acceptance Scenarios**:
1. **Given** the Club tab, **When** I view the map, **Then** I see pins for all registered clubs with their details accessible on click.

## 4. Requirements

### Functional Requirements
- **FR-SEC-001**: System MUST implement a season-based Elo or Point-based ranking system.
- **FR-SEC-002**: System MUST allow clubs to manage participant lists and entry fees/links.
- **FR-SEC-003**: System MUST provide automatic bracket generation for tournaments.
- **FR-SEC-004**: System MUST include a matchmaking feature for friendly matches based on location.

### Design Requirements
- **DR-SEC-001**: Theme: Modern "White" with "Sport Green" and "Light Blue" accents.
- **DR-SEC-002**: Layout: Mobile-First with a 5-tab "Clash Royale" style bottom navigation.

## 5. Success Criteria
- **SC-SEC-001**: Automatic bracket generation takes less than 2 seconds for up to 64 players.
- **SC-SEC-002**: Mobile navigation must be accessible with a single thumb (bottom zone).
- **SC-SEC-003**: Tournament registration status must update in real-time across all connected clients.
