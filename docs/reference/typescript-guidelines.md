# TypeScript Guidelines

## Core Principles
- Use strict typing (avoid `any`)
- Document complex logic or public APIs with JSDoc
- Keep files under 300 lines
- Break down large React components into smaller, single-responsibility components

## Type Safety
- No use of `any` type
- Proper interface definitions for all data structures
- Explicit return types for functions
- Proper type guards where necessary
- Use of generics for reusable components

## Component Structure
- Single responsibility principle
- Props interface definition
- Proper event typing
- State management typing
- Proper typing for hooks and their dependencies

## Documentation
- JSDoc for all public APIs
- Complex logic must be documented
- Type definitions should be self-documenting
- Component props must be documented

## File Organization
- One component per file
- Related types in separate type files
- Utility functions properly typed
- Clear file naming conventions

## Best Practices
- Use type inference where possible
- Avoid type assertions
- Proper error handling with typed errors
- Consistent naming conventions for types and interfaces

## Testing
- Proper typing for test files
- Type-safe mock data
- Proper typing for test utilities
- Type checking in test assertions 