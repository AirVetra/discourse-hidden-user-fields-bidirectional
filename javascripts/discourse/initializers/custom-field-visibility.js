import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "custom-field-visibility",

  initialize(container) {
    withPluginApi("0.8", (api) => {
      const currentUser = api.getCurrentUser();
      const rules = settings.field_visibility_rules;

      if (!rules || rules.length === 0) {
        return;
      }

      // Get user groups (empty array if not logged in)
      const userGroups = currentUser?.groups || [];
      const userGroupIds = userGroups.map(g => g.id);

      const site = container.lookup("service:site");
      const userFields = site.get("user_fields");

      if (!userFields) {
        return;
      }

      // Track which fields have already been processed for hiding
      const processedFields = new Set();

      rules.forEach((rule, ruleIndex) => {
        const customField = userFields.find(
          (field) => field.name.toLowerCase() === rule.field_name.toLowerCase()
        );

        if (!customField) {
          return;
        }

        const fieldId = customField.id;
        const fieldName = customField.dasherized_name || customField.name.toLowerCase().replace(/\s+/g, '-');

        // Only inject hide CSS once per field
        if (!processedFields.has(fieldId)) {
          const hideStyle = document.createElement('style');
          hideStyle.id = `custom-field-visibility-hide-${fieldId}`;
          hideStyle.innerHTML = `
            .public-user-field.${fieldName} { display: none !important; }
            .public-user-field.public-user-field__${fieldName} { display: none !important; }
            .user-card .public-user-field.${fieldName} { display: none !important; }
            .user-card .public-user-field__${fieldName} { display: none !important; }
            .user-field-${fieldId} { display: none !important; }
            .user-profile-fields .user-field-${fieldId} { display: none !important; }
            .public-user-fields .user-field-${fieldId} { display: none !important; }
            .collapsed-info .user-field[data-field-id="${fieldId}"] { display: none !important; }
          `;
          document.head.appendChild(hideStyle);
          processedFields.add(fieldId);
        }

        // Check if user is in any of the allowed groups for this rule
        // groups type returns an array of group IDs
        const allowedGroupIds = rule.allowed_groups || [];
        const isInAllowedGroup = allowedGroupIds.some(groupId => userGroupIds.includes(groupId));

        if (isInAllowedGroup) {
          // Inject specific show CSS for this field with unique ID per rule
          const showStyle = document.createElement('style');
          showStyle.id = `custom-field-visibility-show-${fieldId}-rule-${ruleIndex}`;
          showStyle.innerHTML = `
            .public-user-field.${fieldName} { display: block !important; }
            .public-user-field.public-user-field__${fieldName} { display: block !important; }
            .user-card .public-user-field.${fieldName} { display: block !important; }
            .user-card .public-user-field__${fieldName} { display: block !important; }
            .user-field-${fieldId} { display: block !important; }
            .user-profile-fields .user-field-${fieldId} { display: block !important; }
            .public-user-fields .user-field-${fieldId} { display: block !important; }
            .collapsed-info .user-field[data-field-id="${fieldId}"] { display: block !important; }
          `;
          document.head.appendChild(showStyle);
        }
      });
    });
  }
};
