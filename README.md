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

