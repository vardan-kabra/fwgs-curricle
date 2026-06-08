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
  // e.g. "https://script.google.com/macros/s/AKfycbXXXXXXXX/exec"
  endpoint: "",

  // Within this many minutes of a successful load, reuse the cached copy
  // instead of hitting the network again.
  freshMinutes: 10,

  // Bump this (v1 -> v2 ...) if you ever change the data shape, to throw
  // away every visitor's old cached copy.
  cachePrefix: "fwgs:v1:",
};
