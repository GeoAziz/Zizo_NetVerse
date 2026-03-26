# Role-Based Access & Navigation

## Current State
- Admins have access to all pages and controls.
- Standard users/analysts have limited access (some modules hidden/disabled).
- Guests/viewers have minimal or read-only access.

## Recommendations
- Centralize role/permission logic in a context or hook.
- Add tests for all role-based routes and UI elements.
- Show/hide navigation links and actions based on user role.
- Add visual indicators for restricted features.
- Document all roles and their permissions for onboarding.
