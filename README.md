# Hidden User Fields for Discourse

> **⚠️ SECURITY WARNING:** This component provides **UI-level hiding ONLY**. Data is still accessible via API. **[Read full security disclosure →](SECURITY.md)**
>
> **Disclaimer:** The author assumes no liability for data exposure. Test thoroughly before production use.

A Discourse theme component that controls visibility of custom user fields based on **bidirectional group membership**. This ensures that sensitive fields are only shared between members of a specific group (e.g., a "Verified Users" group).

## Features

- **Bidirectional Visibility**: A field is only shown if **BOTH** the viewer **AND** the profile owner are in the allowed group.
- **Self-Visibility**: Users can always see their own restricted fields.
- **Admin/Moderator Override**: Admins and Moderators can see all restricted fields regardless of group membership.
- **Group-Based Configuration**: Easily configure which groups can see which fields via theme settings.
- **Native Integration**: Works seamlessly on User Cards (hover) and User Profiles methods using Discourse's native UI.

## How It Works

1.  **Restricted by Default**: Configured fields are hidden from everyone by default using CSS.
2.  **Privacy Check**: When a user card or profile is loaded, the component checks:
    - Is the viewer the profile owner? -> **SHOW**
    - Is the viewer an Admin or Moderator? -> **SHOW**
    - Is the viewer in the configured Allowed Group? **AND** Is the profile owner in the configured Allowed Group? -> **SHOW**
3.  **Visual Release**: If the check passes, the field is revealed using `display: block !important`.

## Configuration

1.  Navigate to **Admin > Customize > Themes**.
2.  Select the **Hidden User Fields** theme component.
3.  Click **Theme Settings**.
4.  Find **field_visibility_rules**.
5.  Click to add a new rule:
    - **Field Name**: Enter the exact name of the User Field (e.g., `Secret Data`).
    - **Allowed Groups**: Select the group(s) that should share this field.

### Example Scenario

- **Field**: `Secret Data`
- **Group**: `Verification Group`
- **Logic**:
  - **User A** (in Group) views **User B** (in Group) -> **VISIBLE**
  - **User A** (in Group) views **User C** (NOT in Group) -> **HIDDEN**
  - **User C** (NOT in Group) views **User B** (in Group) -> **HIDDEN**
  - **Admin** views anyone -> **VISIBLE**

## Installation

### From Git

1.  Go to **Admin > Customize > Themes**.
2.  Click **Install** > **From a git repository**.
3.  Enter the repository URL.

## Troubleshooting

If fields are not showing up as expected:

1.  Ensure the **Field Name** in settings matches the User Field name exactly (case-insensitive).
2.  Ensure the user is actually in the allowed group.
3.  Check the browser console for any errors (if debug mode is enabled).

## Author

**Alexey Goloviznin** (AirVetra)

- GitHub: [@AirVetra](https://github.com/AirVetra)
- Repository: [discourse-hidden-user-fields-bidirectional](https://github.com/AirVetra/discourse-hidden-user-fields-bidirectional)

> This is a fork with bidirectional visibility enhancements. Original concept by [Derek Putnam](https://github.com/dereklputnam).
