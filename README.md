# SelfTrack — Static Self-Improvement Dashboard

**Version:** v0.1 (MVP scaffold)  
**Live Demo:** [https://selfimprove-web.github.io/](https://selfimprove-web.github.io/)

## 📖 About
SelfTrack is a fully static, offline-first web app for habit tracking, streak building, journaling, and weekly reviews.  
No servers, no accounts, all data stays local in your browser.  
You can export a **save key** (JSON file) and re-import it later to carry your progress across devices.

## 🗂️ Project Structure

- `index.html` — Main entry (router + app root)  
- `.nojekyll` — Disable Jekyll on GitHub Pages  

**css/**  
- `app.css` — Base styles, variables, components  

**js/**  
- `app.js` — App bootstrap + router  
- `ui.js` — Render helpers + views  
- `export.js` — Save key export  
- `import.js` — Save key import  
- `streaks.js` — Streak logic  
- `calendar.js` — Calendar helpers  
- `metrics.js` — Local analytics  
- `onboarding.js` — First-run setup  
- `validators.js` — Schema checks  
- `quotes.js` — Daily quotes loader  

**data/**  
- `quotes.json` — Motivational quotes  

**assets/**  
- `icons.svg` — SVG sprite for UI icons  



## 🔑 Save & Load

* **Export** → generates a JSON file with your habits, streaks, and journal.
* **Import** → upload your saved JSON to restore progress.
  *(All logic is local; nothing is uploaded to a server.)*

## 🛠️ Roadmap

* [ ] Core: Habits, streaks, journaling, weekly view
* [ ] Save key export/import (MVP)
* [ ] Challenge modes (30/75-day)
* [ ] Progress photos (optional)
* [ ] Offline caching (PWA)
* [ ] Encryption for save key (AES-GCM)

## ⚖️ License

MIT License — free to use, modify, and share.
