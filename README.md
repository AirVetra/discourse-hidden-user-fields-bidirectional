# Hidden User Fields for Discourse

> **⚠️ Disclaimer:** The author assumes no liability for data exposure or unintended visibility of user fields. Test thoroughly before production use.

A Discourse theme component that controls visibility of custom user fields based on group membership. Hide sensitive or internal user fields from public view while making them visible to specific groups.

## Features

- **Group-Based Visibility**: Control which groups can see which custom user fields
- **Multiple Rules**: Configure multiple field/group combinations
- **User Card & Profile**: Works on both user cards (hover) and full profile pages
- **Native Display**: Uses Discourse's native field styling
- **Easy Configuration**: Object editor with group picker for managing visibility rules

## Installation

### Option 1: Install from GitHub (Recommended)

1. Go to your Discourse admin panel
2. Navigate to **Customize > Themes**
3. Click **Install** > **From a git repository**
4. Enter: `https://github.com/dereklputnam/discourse-hidden-user-fields`
5. Click **Install**

### Option 2: Install from File

1. Download or clone this repository
2. Zip the entire directory
3. Go to **Customize > Themes** in Discourse admin
4. Click **Install** > **From a file**
5. Upload the zip file

## Configuration

After installation, configure visibility rules:

1. Click on the installed theme
2. Go to **Settings**
3. Edit **field_visibility_rules** using the object editor
4. For each rule:
   - Click **Add Field**
   - Enter the **Field Name** (exact name of your custom user field)
   - Use the **Allowed Groups** picker to select one or more groups
   - Click the checkmark to save

**Example:**
- Field Name: `company`
- Allowed Groups: Select `employees` from the group picker

Users in ANY of the selected groups will be able to see the field.

## Requirements

- Custom user fields must be created in **Admin > Customize > User Fields**
- Groups must exist for the visibility rules to work
- Users must be members of the specified groups to see the fields

## Theme Structure

```
discourse-hidden-user-fields/
├── about.json                          # Theme metadata
├── settings.yml                        # Theme settings schema
├── common/
│   └── common.scss                     # Minimal CSS placeholder
└── javascripts/discourse/initializers/
    └── custom-field-visibility.js      # Main logic
```

## How It Works

1. On page load, the initializer reads your visibility rules
2. For each rule, it finds the corresponding custom field by name
3. Hide CSS is injected once per field to hide it from everyone by default
4. For each rule, if the current user is in any of the allowed groups, show CSS is injected for that specific field
5. Fields are only visible when the user has permission via group membership

## License

MIT
