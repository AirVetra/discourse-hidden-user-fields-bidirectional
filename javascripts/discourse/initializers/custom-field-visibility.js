import { withPluginApi } from "discourse/lib/plugin-api";
import { ajax } from "discourse/lib/ajax";

// Bump version to verify asset reload
const HV_VERSION = "2025-12-23-bidir-visibility-2";

// Early log to confirm the initializer file is loaded at all
console.info(`[Hidden User Fields v${HV_VERSION}] script loaded`);

/**
 * Bidirectional User Field Visibility
 * 
 * This theme component hides user fields based on group membership with bidirectional checking:
 * 1. The VIEWER must be in the allowed group to see the field
 * 2. The PROFILE OWNER must also be in the allowed group for their field to be visible
 * 3. Users always see their own fields regardless of group membership
 */
export default {
  name: "custom-field-visibility",

  initialize(container) {
    withPluginApi("0.8", (api) => {
      const logPrefix = `[Hidden User Fields v${HV_VERSION}]`;
      const currentUser = api.getCurrentUser();
      const rules = settings.field_visibility_rules;

      if (!rules || rules.length === 0) {
        return;
      }

      const site = container.lookup("service:site");
      const userFields = site.get("user_fields");

      console.log(`${logPrefix} init`, {
        rules,
        userFields: userFields?.map?.((f) => ({
          id: f.id,
          name: f.name,
          dasherized_name: f.dasherized_name
        }))
      });

      if (!userFields) {
        console.warn(`${logPrefix} no user_fields found`);
        return;
      }

      // Get current user's group IDs
      const currentUserGroupIds = currentUser?.groups?.map(g => g.id) || [];

      // Cache for fetched user data to avoid duplicate requests
      const userDataCache = new Map();

      /**
       * Get allowed group IDs from a rule
       * @param {Object} rule - The visibility rule
       * @returns {number[]} Array of group IDs
       */
      function getAllowedGroupIds(rule) {
        if (!rule || !rule.allowed_groups) {
          return [];
        }

        // Theme settings "groups" type returns array of group ids (numbers).
        // Be defensive in case of objects or strings from older data.
        if (Array.isArray(rule.allowed_groups)) {
          return rule.allowed_groups
            .map((g) => {
              if (typeof g === "number") {
                return g;
              }
              if (typeof g === "string") {
                const parsed = parseInt(g, 10);
                return isNaN(parsed) ? null : parsed;
              }
              if (g && typeof g === "object" && typeof g.id !== "undefined") {
                return parseInt(g.id, 10);
              }
              return null;
            })
            .filter((id) => typeof id === "number" && !isNaN(id));
        }

        if (typeof rule.allowed_groups === "string") {
          return rule.allowed_groups
            .split(",")
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id));
        }

        return [];
      }

      /**
       * Check if a user is in any of the allowed groups
       * @param {number[]} userGroupIds - User's group IDs
       * @param {number[]} allowedGroupIds - Allowed group IDs
       * @returns {boolean}
       */
      function isUserInAllowedGroups(userGroupIds, allowedGroupIds) {
        return allowedGroupIds.length > 0 && allowedGroupIds.some(groupId => userGroupIds.includes(groupId));
      }

      /**
       * Get field info for a rule
       * @param {Object} rule - The visibility rule
       * @returns {Object|null} Field info with id and selectors
       */
      function getFieldInfo(rule) {
        if (!rule || !rule.field_name) {
          return null;
        }

        const customField = userFields.find(
          (field) => field.name.toLowerCase() === rule.field_name.toLowerCase()
        );

        if (!customField) {
          return null;
        }

        const fieldId = customField.id;
        const fieldName = customField.dasherized_name || customField.name.toLowerCase().replace(/\s+/g, '-');

        return {
          id: fieldId,
          name: customField.name,
          dasherizedName: fieldName,
          selectors: [
            `.public-user-field.${fieldName}`,
            `.public-user-field.public-user-field__${fieldName}`,
            `.user-card .public-user-field.${fieldName}`,
            `.user-card .public-user-field__${fieldName}`,
            `.user-field-${fieldId}`,
            `.user-profile-fields .user-field-${fieldId}`,
            `.public-user-fields .user-field-${fieldId}`,
            `.collapsed-info .user-field[data-field-id="${fieldId}"]`
          ]
        };
      }

      /**
       * Fetch user data including groups
       * @param {string} username - The username to fetch
       * @returns {Promise<Object|null>} User data or null
       */
      async function fetchUserData(username) {
        if (!username) {
          return null;
        }

        // Check cache first
        if (userDataCache.has(username)) {
          return userDataCache.get(username);
        }

        try {
          // Fetch full user data (not forCard) to get groups
          const response = await ajax(`/u/${username}.json`);
          const userData = response?.user || null;
          
          if (userData) {
            userDataCache.set(username, userData);
          }
          
          return userData;
        } catch (error) {
          console.warn(`[Hidden User Fields] Could not fetch user data for ${username}:`, error);
          return null;
        }
      }

      /**
       * Apply visibility rules to fields within a container
       * @param {Element} container - The container element (user card or profile)
       * @param {string} profileUsername - Username of the profile owner
       * @param {number[]} profileUserGroupIds - Group IDs of the profile owner
       */
      function applyVisibilityRules(containerEl, profileUsername, profileUserGroupIds) {
        // If no current user, hide all restricted fields
        if (!currentUser) {
          rules.forEach((rule) => {
            const fieldInfo = getFieldInfo(rule);
            if (!fieldInfo) {
              return;
            }
            const allowedGroupIds = getAllowedGroupIds(rule);
            if (allowedGroupIds.length > 0) {
              fieldInfo.selectors.forEach((selector) => {
                const elements = containerEl.querySelectorAll(selector);
                elements.forEach((el) => {
                  el.style.setProperty('display', 'none', 'important');
                });
              });
            }
          });
          return;
        }

        const isOwnProfile = currentUser.username.toLowerCase() === profileUsername.toLowerCase();

        // Aggregate visibility per field so that multiple rules for the same field
        // result in OR logic (visible if any matching rule allows it).
        const fieldVisibility = new Map();

        rules.forEach((rule) => {
          const fieldInfo = getFieldInfo(rule);
          if (!fieldInfo) {
            console.warn(`${logPrefix} skip rule without matching field`, rule);
            return;
          }

          const allowedGroupIds = getAllowedGroupIds(rule);
          let shouldShow = false;

          if (isOwnProfile) {
            shouldShow = true;
          } else if (currentUser.admin || currentUser.moderator) {
            shouldShow = true;
          } else if (allowedGroupIds.length === 0) {
            shouldShow = true;
          } else {
            // Bidirectional, group-isolated visibility:
            // viewer and owner must share at least one allowed group.
            const commonGroups = allowedGroupIds.filter(
              (groupId) =>
                currentUserGroupIds.includes(groupId) &&
                profileUserGroupIds.includes(groupId)
            );
            shouldShow = commonGroups.length > 0;

            console.log(`${logPrefix} rule check`, {
              field: fieldInfo.name,
              ruleField: rule.field_name,
              allowedGroupIds,
              currentUserGroupIds,
              profileUserGroupIds,
              commonGroups,
              shouldShow
            });
          }

          const existing = fieldVisibility.get(fieldInfo.id) || {
            info: fieldInfo,
            shouldShow: false
          };
          existing.shouldShow = existing.shouldShow || shouldShow;
          fieldVisibility.set(fieldInfo.id, existing);
        });

        // Apply the aggregated visibility
        fieldVisibility.forEach(({ info, shouldShow }) => {
          info.selectors.forEach((selector) => {
            const elements = containerEl.querySelectorAll(selector);

            // Debug counts to ensure selectors match elements
            console.log(`${logPrefix} apply`, {
              field: info.name,
              selector,
              count: elements.length,
              shouldShow
            });

            elements.forEach((el) => {
              const validDisplay = shouldShow ? "block" : "none";
              el.style.setProperty("display", validDisplay, "important");

              if (shouldShow) {
                el.style.setProperty("visibility", "visible", "important");
                el.style.setProperty("opacity", "1", "important");
              } else {
                // Force-hide defensively
                el.style.setProperty("visibility", "hidden", "important");
                el.style.setProperty("opacity", "0", "important");
              }
            });
          });

          // Also check document-wide for user cards that might be outside the container
          if (containerEl.id === "user-card") {
            info.selectors.forEach((selector) => {
              const elements = document.querySelectorAll(selector);
              elements.forEach((el) => {
                if (containerEl.contains(el) || el.closest("#user-card") === containerEl) {
                  const validDisplay = shouldShow ? "block" : "none";
                  el.style.setProperty("display", validDisplay, "important");
                  if (shouldShow) {
                    el.style.setProperty("visibility", "visible", "important");
                    el.style.setProperty("opacity", "1", "important");
                  } else {
                    el.style.setProperty("visibility", "hidden", "important");
                    el.style.setProperty("opacity", "0", "important");
                  }
                }
              });
            });
          }
        });
      }

      /**
       * Handle user card appearance
       * @param {Element} userCard - The user card element
       */
      async function handleUserCard(userCard) {
        // Extract username from the user card
        // The username can be found in various places
        const usernameEl = userCard.querySelector('.names__primary a.user-profile-link');
        const usernameFromHref = usernameEl?.getAttribute('href');
        let username = null;

        if (usernameFromHref) {
          // Extract username from /u/username path
          const match = usernameFromHref.match(/\/u\/([^/]+)/);
          if (match) {
            username = match[1];
          }
        }

        // Fallback: try to get from username class
        if (!username) {
          const classList = Array.from(userCard.classList);
          const userClass = classList.find(c => c.startsWith('user-card-'));
          if (userClass) {
            username = userClass.replace('user-card-', '');
          }
        }

        if (!username) {
          return;
        }

        // Fetch profile owner's data to get their groups
        const profileUserData = await fetchUserData(username);
        const profileUserGroupIds = profileUserData?.groups?.map(g => g.id) || [];

        // Apply visibility rules
        applyVisibilityRules(userCard, username, profileUserGroupIds);
      }

      /**
       * Handle user profile page
       */
      async function handleUserProfile() {
        // Get username from URL
        const pathMatch = window.location.pathname.match(/\/u\/([^/]+)/);
        if (!pathMatch) {
          return;
        }

        const username = pathMatch[1];
        const profileContainer = document.querySelector('.user-main');

        if (!profileContainer) {
          return;
        }

        // Fetch profile owner's data to get their groups
        const profileUserData = await fetchUserData(username);
        const profileUserGroupIds = profileUserData?.groups?.map(g => g.id) || [];

        // Apply visibility rules
        applyVisibilityRules(profileContainer, username, profileUserGroupIds);
      }

      /**
       * Set up MutationObserver to watch for user cards and profile changes
       */
      function setupObserver() {
        // Initial hide - hide all restricted fields by default
        // They will be shown when visibility is determined
        rules.forEach((rule) => {
          const fieldInfo = getFieldInfo(rule);
          if (!fieldInfo) {
            return;
          }

          const allowedGroupIds = getAllowedGroupIds(rule);
          
          // Only hide fields that have group restrictions
          if (allowedGroupIds.length > 0) {
            const style = document.createElement('style');
            style.id = `hidden-user-field-initial-${fieldInfo.id}`;
            style.textContent = fieldInfo.selectors.map(s => `${s} { display: none; }`).join('\n');
            document.head.appendChild(style);
          }
        });

        // MutationObserver to watch for user cards
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            // Check for user card becoming visible
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const target = mutation.target;
              if (target.id === 'user-card' && target.classList.contains('show')) {
                handleUserCard(target);
              }
            }

            // Check for added nodes (user card or profile content)
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  // Check if it's a user card
                  if (node.id === 'user-card' || node.querySelector?.('#user-card')) {
                    const userCard = node.id === 'user-card' ? node : node.querySelector('#user-card');
                    if (userCard?.classList.contains('show')) {
                      handleUserCard(userCard);
                    }
                  }

                  // Check if it's profile content
                  if (node.classList?.contains('user-main') || node.querySelector?.('.user-main')) {
                    handleUserProfile();
                  }

                  // Check for public-user-fields being added
                  if (node.classList?.contains('public-user-fields') || node.querySelector?.('.public-user-fields')) {
                    // Re-check visibility - could be user card or profile
                    const userCard = document.querySelector('#user-card.show');
                    if (userCard) {
                      handleUserCard(userCard);
                    } else {
                      handleUserProfile();
                    }
                  }
                }
              });
            }
          });
        });

        // Start observing
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class']
        });

        // Handle initial page load for profile pages
        if (window.location.pathname.includes('/u/')) {
          // Wait a bit for the page to render
          setTimeout(handleUserProfile, 100);
        }

        // Listen for route changes (Ember navigation)
        api.onPageChange((url) => {
          if (url.includes('/u/')) {
            setTimeout(handleUserProfile, 100);
          }
        });
      }

      // Initialize
      setupObserver();
    });
  }
};
