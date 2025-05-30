# Organization Tags Feature Specification

## Overview

The Organization Tags feature enables universities to tag alumni profiles with affiliated organizations such as fraternities, honor societies, and student groups. This enhances profile discoverability and provides valuable context about alumni affiliations.

## Core Functionality

### 1. Tag Management

#### Tag Creation
- Only university admins and editors can create tags
- Tags require:
  - Name (unique within university)
  - Type (fraternity, sorority, honor society, etc.)
  - Optional description
  - Optional founding year
  - Optional category

#### Tag Assignment
- Tags can be assigned to profiles during:
  - Initial profile creation
  - Profile editing
  - Bulk operations
- Maximum of 10 tags per profile
- Auto-complete suggestions based on existing tags

### 2. Tag Display

#### UI Components
- Tag chips under profile name
- Tag filter sidebar on university pages
- Tag cloud for popular organizations
- Tag-based search suggestions

#### Styling
- Consistent chip design
- Color coding by tag type
- Hover tooltips with additional info
- Responsive layout adaptation

### 3. Search & Filtering

#### Search Features
- Full-text search across tag names
- Type-based filtering
- Category-based filtering
- Year-based filtering
- University-specific filtering

#### Performance
- Indexed fields for fast search
- Cached tag lists
- Paginated results
- Debounced search input

## Technical Implementation

### Data Model

```typescript
interface OrganizationTag {
  id: string;
  name: string;
  type: 'fraternity' | 'sorority' | 'honor_society' | 'student_group' | 'other';
  description?: string;
  createdAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  metadata: {
    foundingYear?: number;
    category?: string;
    universityId?: string;
  };
}

interface TagAssignment {
  profileId: string;
  tagId: string;
  assignedBy: string;
  assignedAt: Timestamp;
  role?: string;
  years?: string;
  verified: boolean;
}
```

### Database Structure

```
/universities/{universityId}/
  /tags/{tagId}/
    - name
    - type
    - description
    - metadata
  /profiles/{profileId}/
    - orgTags: string[]
    - affiliations: TagAssignment[]
```

### Security Rules

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /universities/{universityId}/tags/{tagId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/universities/$(universityId)/permissions/$(request.auth.uid)).data.role in ['admin', 'editor']);
    }
    
    match /universities/{universityId}/profiles/{profileId} {
      allow read: if true;
      allow update: if request.auth != null && 
        (get(/databases/$(database)/documents/universities/$(universityId)/permissions/$(request.auth.uid)).data.role in ['admin', 'editor']) &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['orgTags', 'affiliations']);
    }
  }
}
```

### API Endpoints

```typescript
// GET /api/universities/{universityId}/tags
interface GetTagsRequest {
  query: {
    search?: string;
    type?: string;
    category?: string;
    page?: number;
    limit?: number;
  };
}

// POST /api/universities/{universityId}/tags
interface CreateTagRequest {
  body: {
    name: string;
    type: string;
    description?: string;
    metadata?: {
      foundingYear?: number;
      category?: string;
    };
  };
}

// PUT /api/universities/{universityId}/profiles/{profileId}/tags
interface UpdateProfileTagsRequest {
  body: {
    tags: string[];
    affiliations: Array<{
      tagId: string;
      role?: string;
      years?: string;
    }>;
  };
}
```

## UI Components

### Tag Management

```typescript
interface TagManagementProps {
  universityId: string;
  onTagCreated: (tag: OrganizationTag) => void;
  onTagUpdated: (tag: OrganizationTag) => void;
  onTagDeleted: (tagId: string) => void;
}

interface TagAssignmentProps {
  profileId: string;
  universityId: string;
  currentTags: string[];
  onTagsUpdated: (tags: string[]) => void;
}
```

### Tag Display

```typescript
interface TagChipProps {
  tag: OrganizationTag;
  onClick?: () => void;
  onRemove?: () => void;
  variant?: 'default' | 'compact' | 'interactive';
}

interface TagFilterProps {
  universityId: string;
  selectedTags: string[];
  onTagsSelected: (tags: string[]) => void;
  onTagsCleared: () => void;
}
```

## Performance Considerations

### Caching Strategy
- Cache tag lists at university level
- Cache popular tags
- Cache search results
- Implement cache invalidation on updates

### Indexing
- Create composite indexes for:
  - Tag search (name, type, category)
  - Profile filtering by tags
  - Tag popularity

### Batch Operations
- Batch tag assignments
- Batch tag updates
- Batch tag deletions

## Monitoring & Analytics

### Metrics to Track
- Tag creation rate
- Tag assignment rate
- Search performance
- Filter usage
- Tag popularity

### Alerts
- High error rates in tag operations
- Slow search response times
- Failed tag assignments
- Cache hit/miss ratios

## Testing Strategy

### Unit Tests
- Tag validation
- Tag assignment logic
- Search functionality
- Filter operations

### Integration Tests
- Tag creation workflow
- Tag assignment workflow
- Search and filter workflow
- Permission checks

### E2E Tests
- Complete tag management flow
- Profile tagging flow
- Search and discovery flow

## Migration Plan

### Phase 1: Foundation
- Implement data model
- Create basic CRUD operations
- Set up security rules

### Phase 2: UI Implementation
- Build tag management interface
- Create tag assignment UI
- Implement search and filters

### Phase 3: Optimization
- Add caching
- Optimize search
- Implement batch operations

### Phase 4: Analytics
- Add monitoring
- Implement analytics
- Set up alerts

## Success Criteria

### Technical
- Search response < 100ms
- Tag assignment < 200ms
- Cache hit ratio > 80%
- Zero data loss

### Business
- Tag usage growth > 20% MoM
- Search satisfaction > 4.5/5
- Tag assignment completion > 95%
- Profile completion rate maintained

### User Experience
- Intuitive tag management
- Fast search and filtering
- Clear tag display
- Smooth assignment workflow 