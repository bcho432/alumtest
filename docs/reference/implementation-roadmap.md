# Implementation Roadmap

This document outlines the detailed implementation plan for transitioning from the memorial system to a university-managed alumni profiles platform. The plan is structured into phases to ensure incremental value delivery and reduced technical risk.

## Table of Contents
1. [Overview](#overview)
2. [Phase 0: Cleanup & Pivot Finalization](#phase-0-cleanup--pivot-finalization)
3. [Phase 1: Core Permissions, Roles, & Security](#phase-1-core-permissions-roles--security)
4. [Phase 2: Profile Creation, Editing, and Lifecycle](#phase-2-profile-creation-editing-and-lifecycle)
5. [Phase 3: Admin Dashboards and Management Panels](#phase-3-admin-dashboards-and-management-panels)
6. [Phase 4: Media Uploads, Comments & Notifications](#phase-4-media-uploads-comments--notifications)
7. [Phase 5: Public UI, Discovery, & Viewer Experience](#phase-5-public-ui-discovery--viewer-experience)
8. [Phase 6: QA, Testing, and Rollout](#phase-6-qa-testing-and-rollout)
9. [Phase 7: Platform Renaming & Organization Tags](#phase-7-platform-renaming--organization-tags)
10. [Deferred Features](#deferred-features)
11. [Success Metrics](#success-metrics)

## Overview

The implementation is organized into 6 major phases, each with tightly scoped goals. This ensures:
- Incremental value delivery
- Reduced technical risk
- Clear validation points
- Manageable scope

Each phase includes:
- Specific milestones
- Validation criteria
- Deferred items
- Technical considerations

## Phase 0: Cleanup & Pivot Finalization
**Duration**: 3-5 days

### Purpose
Finalize the pivot from "memorials" to "alumni profiles" and prepare the system for the new model.

### Milestones
- [ ] Migrate all legacy `memorials` to `profiles` collection
- [ ] Rename field types (e.g., `fullName` → `name`, `isDeceased` flag)
- [ ] Remove candle and memorial-only UI components
- [ ] Set profile status `draft` by default
- [ ] Add `status: 'draft' | 'published'` and `isDeceased: boolean`
- [ ] Remove memorial-specific UI components and routes
- [ ] Update profile schema with new fields

### Validation
- Data integrity checks post-migration
- UI smoke test (no visual regressions)
- Legacy features removed from public routes

### Deferred
- Memorial archival or export logic (Phase 5)

## Phase 1: Core Permissions, Roles, & Security
**Duration**: 1.5-2 weeks

### Purpose
Build the foundation for university access control, collaboration, and secure CRUD operations.

### Milestones
- [ ] Implement `University`, `Profile`, `User`, `Role`, `Permission` data models
- [ ] Add Firestore security rules for:
  - Only university admins can assign roles
  - Editors can only update allowed fields
- [ ] Add service account-only university creation
- [ ] Add dashboard access for users who are admins
- [ ] Add "pinned school" UI for signed-in users

### Key Functionality
- Role-based access (`admin`, `editor`, `contributor`, `viewer`)
- Per-profile and per-university roles
- Public/private profile visibility logic
- Profile permission dashboard per university
- Remove dual sign-in model

### Validation
- Firebase emulators for security rules
- RBAC integration tests
- UI conditionally renders dashboard links by role

### Deferred
- Permission inheritance (Phase 3)
- Audit logs (Phase 4)

## Phase 2: Profile Creation, Editing, and Lifecycle
**Duration**: 2 weeks

### Purpose
Establish structured profile creation, editing, and publishing workflows.

### Milestones
- [ ] Profile setup wizard
  - Page 1: Timeline builder (education, jobs, events)
  - Page 2: Story prompts (select question categories)
- [ ] Autosave and draft state support
- [ ] Profile preview before publishing
- [ ] Admin toggle for publishing profile
- [ ] Edit workflow reuses creation UI with pre-filled data

### Key UX
- Vertical timeline with smooth scroll
- Optional fields visually marked
- Profile goes live only after admin review

### Validation
- Change diffing
- Form validation
- Auto-save and local restore after crash

### Deferred
- Real-time multi-user editing (Phase 5)
- Edit version history (Phase 5)

## Phase 3: Admin Dashboards and Management Panels
**Duration**: 2.5 weeks

### Purpose
Allow university admins to manage users, roles, permissions, and school data.

### Milestones
- [ ] University admin dashboard:
  - List all profiles
  - Filter by status
  - Edit permission dropdowns
  - Invite new admins/editors by email
- [ ] Add/remove admins
- [ ] Profile permissions editor (by dropdown)
- [ ] Comment moderation tools

### Key UX
- Permissions UI is centralized
- School page admin and profile permission management separated
- Role type badge shown beside usernames in dashboards

### Validation
- Role change tests
- Invite + account creation flow
- Permissions summary view

### Deferred
- User analytics & engagement charts (Phase 6)

## Phase 4: Media Uploads, Comments & Notifications
**Duration**: 2 weeks

### Purpose
Launch core interaction and content systems.

### Milestones
- [ ] Media upload UI with validation:
  - 20 images max, 5MB each
  - Allowed types: jpeg, png
- [ ] Create media processing queue:
  - Cloud Functions for thumbnails, optimizations
- [ ] Comment system:
  - 3-level threading
  - University admin can delete any comment
- [ ] Email verification before commenting
- [ ] Notification center for admins/editors

### Technical
- Comment schema with `threadLevel`, `status`
- Notification delivery via email + in-app queue

### Validation
- Media preview + upload test
- Comment creation, deletion
- Notification delivery audit

### Deferred
- User notification preferences
- Spam flagging and AI moderation

## Phase 5: Public UI, Discovery, & Viewer Experience
**Duration**: 2.5 weeks

### Purpose
Deliver polished, intuitive public-facing interfaces for school and profile discovery.

### Milestones
- [ ] Public school landing pages with:
  - Amazon-style cards (flip on hover)
  - Featured alumni
  - Filter/search by category
- [ ] Individual profile view (timeline, stories)
- [ ] SEO-friendly routing
- [ ] Account creation screen (email x2, username, newsletter checkbox)
- [ ] "Pin this school" for signed-in users
- [ ] Forgot password flow

### Design Notes
- "Big tech" aesthetic: transitions, hover states, clear CTA buttons
- Page performance is prioritized over mobile optimization (mobile deferred)

### Validation
- Lighthouse tests
- First paint < 1.5s
- Responsive scroll tests for timeline

### Deferred
- Mobile-first UX refinements
- Language/localization
- Analytics integration

## Phase 6: QA, Testing, and Rollout
**Duration**: 1.5 weeks

### Purpose
Finalize system reliability and prepare for production rollout.

### Milestones
- [ ] E2E tests for:
  - Profile creation to publish
  - Role assignment + dashboard flows
  - Commenting and media upload
- [ ] Load test: 1,000 concurrent users
- [ ] Rollback testing
- [ ] Staging launch and pilot with test university

### Validation
- Full coverage tests
- Performance metrics logging
- Real-user acceptance testing

## Phase 7: Platform Renaming & Organization Tags
**Duration**: 2 weeks

### Purpose
Implement platform renaming to "Storiat" and add organization tagging functionality.

### Milestones
- [ ] Platform Renaming:
  - [ ] Update all internal references
  - [ ] Update UI components and routes
  - [ ] Update meta tags and legal documents
  - [ ] Implement 301 redirects for old routes
  - [ ] Update environment variables

- [ ] Organization Tags:
  - [ ] Implement tag data model and schema
  - [ ] Create tag management UI for admins
  - [ ] Add tag assignment to profile creation/editing
  - [ ] Implement tag search and filtering
  - [ ] Add tag display components
  - [ ] Create tag analytics and reporting

### Key Functionality
- Tag Management:
  - Create/edit/delete tags
  - Assign tags to profiles
  - Search and filter by tags
  - Tag analytics and reporting

- Platform Renaming:
  - Consistent branding across all touchpoints
  - SEO-friendly redirects
  - Updated documentation
  - User communication plan

### Technical Considerations
- Tag System:
  - Efficient indexing for search
  - Caching strategy for tag lists
  - Batch operations for tag updates
  - Tag validation and normalization

- Renaming:
  - Database migration strategy
  - Cache invalidation
  - CDN updates
  - Monitoring for broken links

### Validation
- Tag System:
  - Search performance
  - Tag assignment workflow
  - Filter accuracy
  - UI responsiveness

- Renaming:
  - All references updated
  - Redirects working
  - SEO impact minimal
  - No broken links

### Deferred
- Tag suggestions based on profile content
- Tag hierarchy and relationships
- Advanced tag analytics
- Tag-based recommendations

## Deferred Features

| Feature | Description | Target Phase |
|---------|-------------|--------------|
| Profile edit history | Timeline of who changed what and when | Post-MVP |
| SSO with Gmail/Outlook | Secure sign-in with institutional providers | Post-MVP |
| Notification preferences | User setting center | Post-MVP |
| Comment spam detection | Auto-flagging, AI moderation queue | Post-MVP |
| Email alerts to invited users | Different emails for unregistered vs. existing users | Post-MVP |
| Analytics Dashboard | Engagement and profile reach stats | Post-MVP |
| Mobile-first UX | Only basic responsive support initially | Post-MVP |
| Chatbot feature | Enable premium chatbot training later | Post-MVP |

## Success Metrics

### Technical Metrics
- Zero data loss during migration
- API response time < 200ms
- Test coverage > 90%
- Zero critical security vulnerabilities
- Tag search response < 100ms
- Redirect response < 50ms

### Business Metrics
- Successful data migration rate > 99.9%
- User adoption rate > 80%
- Feature usage statistics meeting targets
- Performance metrics within SLA
- Tag usage growth > 20% month-over-month
- Zero SEO ranking impact from renaming

### User Experience Metrics
- Tag assignment completion rate > 95%
- Tag search satisfaction > 4.5/5
- Profile completion rate > 90%
- User engagement metrics maintained or improved
- Zero user confusion from platform renaming 