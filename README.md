# Season Ticket Manager

A web app to manage sports season ticket plans across multiple sports and teams. Track who attends each game, manage ticket transfers, and log payments.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite via Prisma ORM
- **Auth:** JWT + bcrypt

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Install dependencies

```bash
npm install
```

### Set up the database

```bash
cd server
npx prisma migrate dev --name init
```

### Run in development

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

### First run

Register the first account at `/register` — it will automatically be given the **Admin** role.

## Features

- Track multiple season ticket plans (NFL, NBA, MLB, NHL, MLS, etc.)
- Schedule games per plan and assign attendees
- Transfer tickets between people with payment tracking (Venmo, Zelle, Cash, etc.)
- Multi-user with role-based access (Admin / Member)
- Dark/light theme
