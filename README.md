# Kai — Rule-Based Assistant


> A self-contained assistant built on pattern-matching and deterministic code. No AI model, no cloud inference. Every reply traces back to logic you can read.

**Live:** https://kai-assistant-hazel.vercel.app  
**Repo:** https://github.com/luokai25/kai-web  
**Created by:** Luokai

---

## What Kai can do

| Feature | How to use |
|-------|----------|
| 🌤️ Weather | `weather` or `weather in Tokyo` |
| 🌱 Currency | `convert 100 usd to eur` |
| 🌐 Wikipedia | `what is the Eiffel Tower` |
| 🔖 Dictionary | `define serendipity` |
| ´ Image gen | `image of a neon city at night` |
| ✓ Tasks | `add task finish report high` |
| 📍 Due dates | `add task call dentist due tomorrow` |
| 🤂 Voice | Toggle in Settings |
| 📊 EXport | Account menu ‒ Export my data |
| 🐐 Auth | Google OAuth via Supabase |
| 💕 Streaks | Daily usage tracked |

## Stack

- **Hosting:** Vercel (auto-deploy via GitHub Actions)
- **Backend:** Supabase (Postgres + Auth + Edge Functions + pg_net)
- **Images:** Pollinations.ai / Flux model (free, no key)
- **Weather:** Open-Meteo (free, no key)
- **Currency:** Frankfurter.app (free, no key)

## Auto-deploy

Push to `main` → GitHub Actions → Vercel API → Production

**Setup:** Add `VERCEL_TOKEN` to repo secrets

---
*No AI was used in generating Kai�'s responses. Built by Luokai.*