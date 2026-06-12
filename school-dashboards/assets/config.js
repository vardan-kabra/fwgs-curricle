/* FWGS Curricle — runtime configuration.
 *
 * The ONLY file you edit when you deploy:
 *   set `endpoint` to your Apps Script Web App "/exec" URL.
 *
 * Leave endpoint = "" to serve the bundled snapshots in /fixtures.
 * That is how the pages render locally (and as an offline fallback before
 * the endpoint is wired up).
 */
window.FWGS_CONFIG = {
  // Apps Script Web App /exec URL (currently pointed at the TEST COPIES).
  endpoint: "https://script.google.com/macros/s/AKfycbzTEtZcwnaHlE6e9NO-9QVSrb9RavX1YaGvwRbPhSc4DqTWyMRb--gbcvOw03r026Q1VA/exec",

  // Within this many minutes of a successful load, reuse the cached copy
  // instead of hitting the network again.
  freshMinutes: 10,

  // Bump this (v1 -> v2 ...) if you ever change the data shape, to throw
  // away every visitor's old cached copy.
  cachePrefix: "fwgs:v1:",

  // --- Bus app sign-in gate ---
  // Require a Google sign-in (any Gmail) before the Bus Stop Finder loads.
  gateBuses: true,
  // OAuth Client ID from Google Cloud (…apps.googleusercontent.com). Must match
  // CLIENT_ID in apps-script/Code.gs. Leave "" until you've created it.
  googleClientId: "",
};
