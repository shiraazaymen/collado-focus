// ─── MEDIA URL UTILITIES ─────────────────────────────────────────────────────
// Isolated from components so they can be tested independently
// and reused by future features (e.g. a search-based track selector).

/**
 * Extracts a YouTube video ID from any of the common URL formats,
 * or returns the string as-is if it looks like a bare 11-char ID.
 *
 * Supported formats:
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://music.youtube.com/watch?v=VIDEO_ID
 *   VIDEO_ID  (bare 11-character alphanumeric)
 *
 * @param {string} input
 * @returns {string|null}  video ID, or null if unrecognized
 */
export function parseYouTubeId(input) {
  if (!input || typeof input !== "string") return null;
  const url = input.trim();

  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/watch\?v=([^&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /music\.youtube\.com\/watch\?v=([^&#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Accept bare 11-character video IDs
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return null;
}

/**
 * Converts a public Spotify URL into an embed URL accepted by the
 * Spotify iframe API.
 *
 * Supported resource types: track, album, playlist, artist, episode
 *
 * @param {string} input
 * @returns {string|null}  embed URL, or null if unrecognized
 */
export function parseSpotifyEmbed(input) {
  if (!input || typeof input !== "string") return null;

  const match = input.match(
    /spotify\.com\/(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/
  );

  if (!match) return null;
  const [, type, id] = match;
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

/**
 * Builds a YouTube embed src from a video ID with sane defaults.
 * autoplay=1 is important for the floating player UX so music
 * resumes when the player is revealed.
 *
 * @param {string} videoId
 * @returns {string}
 */
export function buildYouTubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}