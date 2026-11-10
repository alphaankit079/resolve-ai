<div align="center">

# ⚡ ResolveAI
### *The Next-Gen Full-Stack Customer Support & Ticketing SaaS Platform*

[![Status](https://img.shields.io/badge/Status-Live%20%26%20Operational-success?style=for-the-badge&logo=vercel)](https://github.com/alphaankit079/resolve-ai)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.io%20%2B%20Gemini%20AI-blue?style=for-the-badge&logo=react)](https://github.com/alphaankit079/resolve-ai)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

*Inspired by Linear & Zendesk UI aesthetics — built for blazing-fast customer support operations.*

</div>

---

## 🚀 About The Project

**ResolveAI** is an enterprise-grade, full-stack customer support ticketing system designed with a sleek, dark-mode SaaS interface. It solves traditional ticketing bottlenecks by integrating real-time collaboration via WebSockets, sequential ID tracking (`TKT-1001`), instant voice note uploads for customers, and automated AI-driven responses powered by Google's Gemini AI.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons, Axios, Socket.io-client
* **Backend:** Node.js, Express.js, Socket.io (Real-time events)
* **Database:** MongoDB Atlas (Mongoose ODM)
* **AI Engine:** Google Gemini AI SDK (`gemini-3.5-flash`)
* **Deployment:** Vercel (Frontend) & Render (Backend)

---

## ✨ Key Features

* **🔢 Sequential Ticket IDs:** Clean, predictable ticket identifiers (e.g., `TKT-1001`, `TKT-1002`) replacing random hashes.
* **🎙️ Voice Note Support:** Integrated MediaRecorder API allowing customers and agents to record and attach voice snippets directly to tickets.
* **⚡ Real-Time Collaboration:** Powered by Socket.io for live ticket updates, status changes, and instant notifications without page reloads.
* **🤖 AI Automation:** Automated response generation and smart triage using Google Gemini AI.
* **🎨 Linear & Vercel Inspired UI:** Immersive dark-mode dashboard featuring clean typography, high-contrast badges, and custom scrollbars (`#44ACFF` accent styling).

---

## 📁 Project Structure

```text
resolve-ai/
├── backend/
│   ├── models/         # Mongoose schemas (User, Ticket, Message)
│   ├── routes/         # Express API routes (Auth, Tickets, AI)
│   ├── .env.example    # Environment variables template
│   └── server.js       # Main server & Socket.io configuration
├── frontend/
│   ├── src/
│   │   ├── components/ # AdminWorkspace, CustomerPortal, Auth components
│   │   ├── api.js      # Centralized Axios & Socket configuration
│   │   ├── App.jsx     # Root component & routing
│   │   └── main.jsx    # React entry point
│   └── package.json
└── README.md
