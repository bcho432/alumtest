# File Registry

This document tracks all files in the project, their purposes, and their relationships. It should be updated whenever files are added, modified, or removed.

## Directory Structure

```
src/
├── app/                    # Next.js app directory
├── components/            # React components
├── lib/                  # Utility functions and services
├── contexts/            # React contexts
├── types/              # TypeScript type definitions
├── styles/             # Global styles
└── tests/              # Test files
```

## File Registry

### App Directory (`src/app/`)

#### Authentication Routes (`src/app/(auth)/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `signin/page.tsx` | Sign-in page component | `AuthContext`, `AuthService` | YYYY-MM-DD |
| `signup/page.tsx` | Sign-up page component | `AuthContext`, `AuthService` | YYYY-MM-DD |
| `reset-password/page.tsx` | Password reset page | `AuthService` | YYYY-MM-DD |

#### Dashboard Routes (`src/app/(dashboard)/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `dashboard/page.tsx` | Main dashboard page | `DashboardLayout`, `StatsService` | YYYY-MM-DD |
| `profiles/page.tsx` | Profiles listing page | `ProfileList`, `ProfileService` | YYYY-MM-DD |
| `settings/page.tsx` | User settings page | `SettingsForm`, `UserService` | YYYY-MM-DD |

#### Public Routes (`src/app/(public)/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `home/page.tsx` | Landing page | `HeroSection`, `FeatureList` | YYYY-MM-DD |
| `about/page.tsx` | About page | `AboutSection`, `TeamList` | YYYY-MM-DD |

### Components Directory (`src/components/`)

#### Common Components (`src/components/common/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `Button.tsx` | Reusable button component | `styles/button.css` | YYYY-MM-DD |
| `Input.tsx` | Form input component | `styles/input.css` | YYYY-MM-DD |
| `Card.tsx` | Card container component | `styles/card.css` | YYYY-MM-DD |

#### Feature Components (`src/components/features/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `ProfileCard.tsx` | Profile display card | `ProfileService`, `types/Profile` | YYYY-MM-DD |
| `CommentSection.tsx` | Comments display and input | `CommentService`, `types/Comment` | YYYY-MM-DD |
| `MediaGallery.tsx` | Media display gallery | `MediaService`, `types/Media` | YYYY-MM-DD |

#### Layout Components (`src/components/layouts/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `DashboardLayout.tsx` | Dashboard layout wrapper | `Navigation`, `Sidebar` | YYYY-MM-DD |
| `AuthLayout.tsx` | Authentication pages layout | `styles/auth.css` | YYYY-MM-DD |

### Library Directory (`src/lib/`)

#### Firebase (`src/lib/firebase/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `config.ts` | Firebase configuration | `firebase/app` | YYYY-MM-DD |
| `auth.ts` | Firebase auth utilities | `firebase/auth` | YYYY-MM-DD |
| `firestore.ts` | Firestore utilities | `firebase/firestore` | YYYY-MM-DD |

#### Services (`src/lib/services/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `AuthService.ts` | Authentication service | `firebase/auth` | YYYY-MM-DD |
| `ProfileService.ts` | Profile management service | `firebase/firestore` | YYYY-MM-DD |
| `MediaService.ts` | Media handling service | `firebase/storage` | YYYY-MM-DD |

#### Hooks (`src/lib/hooks/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `useAuth.ts` | Authentication hook | `AuthContext` | YYYY-MM-DD |
| `useProfile.ts` | Profile management hook | `ProfileService` | YYYY-MM-DD |
| `useMedia.ts` | Media handling hook | `MediaService` | YYYY-MM-DD |

### Contexts Directory (`src/contexts/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `AuthContext.tsx` | Authentication context | `AuthService` | YYYY-MM-DD |
| `ProfileContext.tsx` | Profile management context | `ProfileService` | YYYY-MM-DD |
| `ThemeContext.tsx` | Theme management context | `styles/theme.css` | YYYY-MM-DD |

### Types Directory (`src/types/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `index.ts` | Type definitions export | - | YYYY-MM-DD |
| `auth.ts` | Authentication types | - | YYYY-MM-DD |
| `profile.ts` | Profile types | - | YYYY-MM-DD |
| `media.ts` | Media types | - | YYYY-MM-DD |

### Styles Directory (`src/styles/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `globals.css` | Global styles | - | YYYY-MM-DD |
| `theme.css` | Theme variables | - | YYYY-MM-DD |
| `components/` | Component-specific styles | - | YYYY-MM-DD |

### Tests Directory (`src/tests/`)
| File | Purpose | Dependencies | Last Updated |
|------|---------|--------------|--------------|
| `setup.ts` | Test setup configuration | `jest` | YYYY-MM-DD |
| `auth.test.ts` | Authentication tests | `AuthService` | YYYY-MM-DD |
| `profile.test.ts` | Profile management tests | `ProfileService` | YYYY-MM-DD |

## File Update Process

1. When adding a new file:
   - Add entry to this registry
   - Include purpose and dependencies
   - Set initial last updated date

2. When modifying a file:
   - Update last updated date
   - Update dependencies if changed
   - Update purpose if changed

3. When removing a file:
   - Mark as deprecated
   - Note removal date
   - Document replacement if applicable

## File Naming Conventions

1. **React Components**
   - PascalCase
   - Descriptive of component purpose
   - `.tsx` extension

2. **Utility Files**
   - camelCase
   - Descriptive of utility purpose
   - `.ts` extension

3. **Style Files**
   - kebab-case
   - Match component name
   - `.css` extension

4. **Test Files**
   - Match source file name
   - `.test.ts` or `.test.tsx` extension

## File Organization Guidelines

1. **Component Files**
   - One component per file
   - Include types in same file
   - Include tests in separate file

2. **Service Files**
   - One service per file
   - Include types in separate file
   - Include tests in separate file

3. **Context Files**
   - One context per file
   - Include provider component
   - Include types in same file

4. **Type Files**
   - Group related types
   - Export from index
   - Include documentation

## File Dependencies

1. **Component Dependencies**
   - List required props
   - List required contexts
   - List required services

2. **Service Dependencies**
   - List required APIs
   - List required utilities
   - List required types

3. **Context Dependencies**
   - List required services
   - List required types
   - List required utilities

## File Maintenance

1. **Regular Updates**
   - Weekly dependency checks
   - Monthly code reviews
   - Quarterly cleanup

2. **Documentation Updates**
   - Update on changes
   - Include examples
   - Include notes

3. **Testing Updates**
   - Update on changes
   - Include new tests
   - Update coverage

## File Version Control

1. **Git Workflow**
   - Feature branches
   - Pull requests
   - Code reviews

2. **Version Tracking**
   - Semantic versioning
   - Changelog updates
   - Release notes

3. **Change Management**
   - Document changes
   - Update registry
   - Notify team 