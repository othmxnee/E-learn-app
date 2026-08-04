E-Learning Platform

This project is a modern web-based e-learning platform designed for universities and higher schools (écoles supérieures).
It helps manage academic structures, modules, learning content, and assessments in a simple and organized way.

Features
Admin

Manage teachers and students

Import students via CSV or add them manually

Support for university and école supérieure systems

Create classes and specialities

Create modules and assign teachers and classes

Teacher

Login using matricule

Access only assigned modules

Upload course materials inside each module

Create assignments with deadlines

View and download student submissions

Student

Login using matricule

Automatically assigned to a class

Access only modules linked to their class

View learning materials

Submit assignments before deadlines

Academic Structure

Without speciality: CP1, CP2, L1, L2, L3, CS1
Example: CP1 – Class 2

With speciality: CS2, CS3, M1, M2
Example: CS2 – IS – Class 1

Student CSV Format
full_name,matricule,year,speciality,class
Ahmed Benali,2023001,CP1,,2
Sara Kacem,2023002,CS2,IS,1

Demo data

The platform can populate itself with a realistic dataset so the dashboards,
charts, filters and pagination are exercised with full tables rather than a
handful of rows.

  npm run seed:demo    build the dataset (clears a previous demo first)
  npm run seed:reset   remove it again

Both are also available to an administrator from the dashboard, as "Load demo
data" and "Reset demo data". Seeding runs as a background job with a progress
bar, because the work takes longer than a request should stay open.

What it creates: 4 departments across 12 programmes, 24 classes, 60 modules,
40 teachers, 600 students, 300 assignments, ~180 course materials and ~4,000
submissions with grades on the work whose deadline has passed. Grades follow a
normal distribution around 13/20, class sizes vary between 20 and 30, roughly
10% of students never signed in and 5% of past assignments received nothing —
the dataset is deliberately uneven, because real data is.

Two properties the seed guarantees:

- Deterministic. The same DEMO_SEED always produces the same people, grades
  and timestamps, so screenshots and demos stay reproducible. Set DEMO_SEED to
  vary it.
- Safe to re-run. Every seeded row is tagged, so a reset removes the demo
  dataset and never touches records you created yourself, and re-running the
  seed replaces the demo rather than duplicating it.

Course materials point at 15 short PDFs committed under backend/seed-data,
reused across modules. Keeping the real files down to 15 keeps the repository
small, and they are served from the repository rather than from uploads/,
which Render wipes on every deploy.

Demo accounts sign in with their matricule and the password demo1234.

Course assistant

Each module page carries a floating assistant that answers questions from that
module's own course materials — and only from them. Ask something the notes
don't cover and it says so rather than inventing an answer; every answer cites
the material and page it came from.

How it works: uploaded PDFs are read (pdf-parse), split into ~800-token
passages with ~100 tokens of overlap, embedded with Gemini, and stored in the
`chunks` table. A question is embedded the same way and scored against that
module's passages by cosine similarity in Node — the corpus is small enough
that a vector database would be overkill. The top passages are handed to
gemini-flash-latest, which is instructed to answer strictly from them.

Setup: set GEMINI_API_KEY on the API service. Without it the app runs exactly
as before and the assistant hides itself rather than failing. New PDF uploads
are indexed automatically in the background; "Rebuild chat index" on the admin
dashboard re-reads everything from scratch.

Access follows the same rules as the rest of the platform: a student can only
ask about modules in their own programme, a teacher about modules they teach,
and each user is limited to 20 questions per hour.

Tech Stack

Frontend:

React

Tailwind CSS

Redux Toolkit

Backend:

Node.js

Express.js

PostgreSQL (Sequelize)

JWT Authentication

Gemini (embeddings + chat, for the course assistant)

Live demo:
https://elearn-27007.netlify.app/

Deploy on Render

The repository ships a Blueprint (render.yaml) that creates two services:

elearn-api — the Express API (rootDir backend)
elearn-web — the Vite build served as a static site (rootDir frontend)

Steps

1. Create a PostgreSQL database and allow access from anywhere (0.0.0.0/0),
   since Render's free instances do not have static outbound IPs.
2. In Render, go to New > Blueprint and pick this repository.
3. When prompted, paste the connection string as DATABASE_URL.
   JWT_SECRET is generated automatically, and the two services discover each
   other's URLs (CLIENT_URL and VITE_API_URL) without any manual input.
4. After the first deploy, create the first administrator by calling
   POST /api/auth/register-admin, or through the register page of the frontend.

The tables are created on boot inside the schema named by DB_SCHEMA (elearn by
default), so the database can be shared with an unrelated application without
the two colliding.

Notes

Free instances sleep after 15 minutes without traffic, so the first request
after an idle period takes about a minute while the service wakes up.

Uploaded course material and submissions are stored on the local filesystem
(backend/uploads), which Render resets on every deploy and restart. To keep
them, uncomment the disk block in render.yaml — this requires a paid instance
type — or move the uploads to an object storage such as S3 or Cloudinary.

