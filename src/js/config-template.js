/* eslint-disable */
// Note that we import these values where needed as "webAppConfig"
// Copy this file to src/js/config.js (git ignores config.js) and change the values there.
module.exports = {
  // Roster console, the web front end for state-roster-pipeline
  NAME_FOR_BROWSER_TAB_TITLE: 'Roster console',

  // The API URL is not set here. The browser calls relative /api/... paths, and Vite forwards them to API_URL (see vite.config.ts).

  LOG_HTTP_REQUESTS: false,               // httpLog function prints each API request to the console
  LOG_ONLY_FIRST_RENDER_EVENTS: false,    // Log the render event for a component, but only the first time
  LOG_RENDER_EVENTS: false,               // renderLog function prints every component render to the console
  LOG_ROUTING: false,
  LOG_SIGNIN_STEPS: false,                // Read by common/utils/logging.js, the console has no sign in
  LOG_CORDOVA_OFFSETS: false,             // Read by common/utils/logging.js, the console has no Cordova app
  LOG_CORDOVA_KEYBOARD_HIDING: false,     // Read by common/utils/logging.js, the console has no Cordova app
};
