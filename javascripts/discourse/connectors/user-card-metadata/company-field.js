export default {
  setupComponent(args, component) {
    const siteSettings = component.siteSettings;
    const customFieldName = siteSettings.custom_field_visibility_custom_field_name;
    const fieldLabel = siteSettings.custom_field_visibility_field_label;

    const user = args.user;
    let customFieldValue = null;

    if (user?.user_fields) {
      // Find the custom field ID
      const site = component.site;
      if (site?.user_fields) {
        const customField = site.user_fields.find(
          (field) => field.name.toLowerCase() === customFieldName.toLowerCase()
        );

        if (customField?.id) {
          customFieldValue = user.user_fields[customField.id];
        }
      }
    }

    component.setProperties({
      fieldLabel: fieldLabel,
      customFieldValue: customFieldValue
    });
  }
};
