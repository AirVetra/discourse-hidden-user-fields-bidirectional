# Changelog

## 0.2.1 — 2025-12-23
- Removed debug logging; kept minimal code.
- Strengthened hiding: forced `display: none` / `visibility: hidden` / `opacity: 0` for disallowed fields to prevent leakage.

## 0.2.0 — 2025-12-23
- Fixed group intersection: a field is shown only when viewer and owner share an allowed group (`allowed_groups`).
- Normalized `allowed_groups` to numeric IDs (supports strings/objects).
- User data caching, basic handling of unauthenticated users, initial hiding of restricted fields.

## 0.1.0 — initial release
- Basic bidirectional visibility (viewer/owner in allowed groups), exceptions for owner, admin, moderator.

