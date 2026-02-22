/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || '.cache/puppeteer',
};
