# Security Policy

## ⚠️ CRITICAL LIMITATION

**This theme component provides UI-level hiding ONLY.**

### What This Component Does NOT Do

- ❌ Does NOT filter API responses
- ❌ Does NOT prevent data access via `/u/username.json`
- ❌ Does NOT protect against browser DevTools inspection
- ❌ Does NOT provide encryption or true data security

### Known Vulnerabilities

#### 1. Direct API Access

Any authenticated user can access all user fields via:

```bash
curl https://your-forum.com/u/username.json
```

**Impact:** All "hidden" fields are visible in the JSON response.

#### 2. Browser Developer Tools

- **Network Tab:** View `/u/username.json` responses
- **Elements Tab:** Modify `display: none` to `display: block`
- **Console:** Access hidden DOM elements via JavaScript

#### 3. JavaScript Disabled

Fields may be exposed if JavaScript fails to load or is disabled.

## Recommendations

### ✅ Safe Use Cases

- Cosmetic privacy (hiding non-critical info from casual viewers)
- Organizational convenience (grouping related fields)
- Reducing UI clutter on public profiles

### ❌ Unsafe Use Cases

- Storing passwords or API keys
- Personal identification numbers (SSN, passport, etc.)
- Financial information
- Medical records
- Any truly confidential data

## For True Security

If you need real data protection:

1. **Use Private Messages** for confidential communication
2. **Implement a Server-Side Plugin** that filters `UserSerializer` before sending to clients
3. **Use External Systems** for sensitive data management
4. **Enable 2FA** and proper authentication controls

## Reporting Security Issues

If you discover a security vulnerability in this component, please report it via GitHub Issues or contact the maintainer directly.

**DO NOT** store sensitive data in Discourse custom user fields regardless of this component.
