# Hidden User Fields Guide

---

## For Admins

### Installation

1. Go to **Admin → Customize → Themes**
2. Click **Install** → **From a git repository**
3. Paste repository URL and install
4. Add component to your active theme

### Configuration

**Step 1: Create User Fields**

- **Admin → Customize → User Fields**
- Create fields to restrict (e.g., "Verification ID")

**Step 2: Create Groups**

- **Admin → Users → Groups**
- Create access groups (e.g., "Verified Members")
- Add users to groups

**Step 3: Configure Component**

- **Admin → Customize → Themes** → Select theme → **Hidden User Fields** → **Settings**
- Find **field_visibility_rules** → **Add Field**:
  - **Field Name**: Exact field name
  - **Allowed Groups**: Select group(s)
  - Save ✓

### Visibility Logic

Field is visible when:

1. **Viewer** is in allowed group AND
2. **Profile Owner** is in allowed group

**Exceptions:**

- Users always see own fields
- **Admins/Moderators see ALL fields**

### ⚠️ Security Warning

**UI-level hiding only, NOT data protection.**

- ✓ Hides fields visually
- ✗ Does NOT filter API (`/u/username.json`)
- ✗ Does NOT prevent DevTools access

**Use for cosmetic privacy only, not sensitive data.**

---

## For Users

### How It Works

**When You CAN See a Field:**

- You are in the allowed group AND
- Profile owner is in the allowed group

**When You CANNOT See a Field:**

- You are NOT in the allowed group, OR
- Profile owner is NOT in the allowed group

**Special Cases:**

- **Own Profile**: You always see your own fields
- **Admins/Mods**: They see all fields

### Privacy Notice

⚠️ **Visual privacy only** - data still accessible via API/DevTools.

**Don't store truly sensitive information in profile fields.**
