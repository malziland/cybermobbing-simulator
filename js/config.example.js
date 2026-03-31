// Firebase configuration — replace with your own Firebase project values
// Copy this file to config.js and fill in your Firebase project details
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Daily view limit (set to 0 to disable)
var DAILY_LIMIT = 1000;

// Helpline configuration for the CTA page.
// Replace with your local helpline (e.g. "Nummer gegen Kummer" in Germany,
// "Pro Juventute 147" in Switzerland, "Childline" in the UK).
// Set logo to '' to hide the logo image.
var helplineConfig = {
  logo: '',                          // Path to logo image (e.g. 'assets/my-helpline.png')
  logoAlt: 'Your Helpline Name',     // Alt text for the logo
  link: 'https://example.com/help',  // Link when clicking the logo
  linkLabel: 'example.com',          // Display text for the link
  infoLink: '',                      // Optional: link to more info about cyberbullying
  infoLabel: 'Weiterführende Infos', // Label for the info link
  infoLabelEn: 'More information',   // English version
  slogan: 'Hilfe holen. Jetzt.',     // Slogan text (your language)
  sloganEn: 'Get help. Now.'         // English version of the slogan
};
