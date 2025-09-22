# SelfTrack

**Version:** v0.7.1 (Clean Build)
**Live Demo:** [https://selfimprove-web.github.io/](https://selfimprove-web.github.io/)

## 📖 About

SelfTrack is a fully static, offline-first web app for habit tracking, streak building, journaling, and calendar-based history.
It runs entirely in your browser. No accounts, no servers, no data collection.
Progress is stored locally, with simple **export/import** options to carry your habits and journal across devices.

## 🗂️ Project Structure

* `index.html` — App shell + router entry
* `.nojekyll` — Keeps GitHub Pages from rewriting assets

**css/**

* `app.css` — Styles, dark/light theme, components

**js/**

* `app.js` — Core bootstrap, state, router, controller
* `ui.js` — UI helpers + views (Today, History, Habits, Journal, Settings)
* `streaks.js` — Streak calculation
* `calendar.js` — Calendar helpers
* `export.js` — Export JSON / Save Key
* `import.js` — Import JSON / Save Key
* `onboarding.js` — First-run setup (welcome banner removed)

**data/**

* `quotes.json` — Motivational quotes

**assets/**

* `icons.svg` — Inline SVG sprite

## 🔑 Save & Load

* **Export** → Download a JSON file with your habits, streaks, and journal
* **Import** → Upload a JSON or paste a Save Key to restore progress
* Everything is 100% local, no syncing to external servers

## 🚀 Features

* Habit tracking with daily check-offs
* Automatic streaks and progress %
* Motivational quote of the day (rotates from `quotes.json`)
* Calendar history with popovers and detailed day view
* Journal with autosave and day navigation
* Dark/Light/Auto themes in Settings
* Data backup & restore (Save Key or JSON file)

## 🛠️ Roadmap

* [ ] Challenge modes (30/75-day)
* [ ] Progress photos (optional)
* [ ] Offline caching & installable PWA
* [ ] Encrypted Save Keys

## ⚖️ License

MIT License — free to use, modify, and share.
