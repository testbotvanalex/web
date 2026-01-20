const { generateWallpaper } = require('../server.js');
const url = require('url');

module.exports = (req, res) => {
    try {
        // Vercel extracts query parameters automatically into req.query
        // But in some edge cases (or local dev with some adapters) we might need to fallback.
        const query = req.query || url.parse(req.url, true).query;

        console.log("Generating wallpaper with params:", query);

        const buffer = generateWallpaper(query);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Good for social images/wallpapers
        res.status(200).send(buffer);
    } catch (err) {
        console.error("Vercel API Error:", err);
        res.status(500).send('Error generating wallpaper: ' + err.message);
    }
};
