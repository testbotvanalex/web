# Calendar Setup Instructions

This folder contains the "Calendar Wallpaper Generator".

## 1. Requirements
To run the FULL automation (creating wallpapers for iPhone), you need **Node.js**.
If you just want to run the web interface to look at it, you can open `index.html`.

## 2. Installation (for automation)
1.  Open a terminal in this folder (`.../citech/calendar`).
2.  Run `npm install` to install dependencies (specifically `canvas`).
3.  Run `node server.js` to start the local server.

## 3. Usage
- Go to `http://localhost:3000` (or whatever port you configure) to see the generator.
- The iPhone Shortcut needs to point to THIS server address (e.g., `http://YOUR_IP:3000/api/wallpaper`).

## Note on Hosting
If you host this on a public web server (like Vercel/Netlify), the `server.js` part (Node.js) must be deployed as a serverless function or backend service. Static hosting alone will NOT generate the images for the iPhone automation.
