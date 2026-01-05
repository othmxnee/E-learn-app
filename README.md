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

MongoDB

JWT Authentication

Live demo:
https://elearn-27007.netlify.app/

