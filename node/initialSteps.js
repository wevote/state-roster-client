// Runs before npm start, npm run dev and npm run build, as WebApp's node/initialSteps.js does.
import fs from 'fs';

// src/js/config.js is not in git. Start a new clone, or the Docker image, from the template.
if (!fs.existsSync('./src/js/config.js')) {
  fs.copyFileSync('./src/js/config-template.js', './src/js/config.js');
  console.log('initialSteps -- created ./src/js/config.js from ./src/js/config-template.js');
}
