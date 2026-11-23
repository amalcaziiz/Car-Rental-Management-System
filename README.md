Car Rental Management System

A full-stack car rental management application built with Node.js, Express, and Oracle SQL/PL/SQL. It handles the day-to-day operations of a rental business: fleet, customers, rentals, payments, maintenance, and insurance, with separate Admin and Staff logins.

The business rules live in the database itself. Triggers prevent double bookings and write an audit trail, and stored procedures and functions handle rental creation, returns, and cost calculation.

Screenshots

Dashboard Fleet management Rentals

Features
Dashboard with total cars, active rentals, cars in maintenance, total revenue, fleet status, revenue by payment method, and cars by category
Management pages for fleet, customers, rentals, payments, maintenance, insurance, and system users
Role-based login for Admin and Staff users
Rental audit log written automatically by an Oracle trigger
Double-booking protection enforced by the database, not just the interface
Data integrity through primary keys, foreign keys, and CHECK constraints (for example, a payment must belong to a rental, and a rental's end date must be after its start date)
Tech Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript
Backend	Node.js, Express.js
Database	Oracle SQL, PL/SQL
Tools	Git, GitHub, Visual Studio Code, Oracle SQL Developer
Architecture
Browser (frontend)  →  Express REST API (backend)  →  Oracle Database (tables, triggers, procedures)

The Express server serves the frontend and exposes the API. It connects to Oracle through a connection pool.

Database Design (Oracle SQL / PL/SQL)

Tables: car_categories, cars, customers, users, rentals, payments, maintenance, insurance, rental_audit

Triggers

Name	What it does
trg_no_double_booking	Blocks a new rental if the car already has an ongoing rental that overlaps the requested dates
trg_rental_audit	Writes a "RENTAL CREATED" entry to the audit table whenever a rental is inserted

Procedures

Name	What it does
create_rental	Calculates the cost from the car's daily rate, inserts the rental, and marks the car as rented
return_car	Marks a rental as returned and makes the car available again
safe_rental	Wraps create_rental with its own error handling
validate_rental_days	Validates input using a user-defined exception

Functions

Name	What it does
calc_cost	Computes rental cost and applies a 5% discount for rentals of 7 days or more
is_available	Returns 1 or 0 depending on whether a car has an ongoing rental

Package: rental_pkg groups the create, return, and cost operations.

The SQL script also includes examples of explicit cursors, cursor FOR loops, %ROWTYPE and user-defined records, and collections (associative arrays and nested tables).

Full script: sql/car_rental_schema.sql

Project Structure
 backend/        Express server and API
 frontend/       HTML, CSS, and JavaScript interface
 sql/            Database schema, triggers, procedures, and sample data
 screenshots/    Images used in this README
Getting Started
Prerequisites
Node.js (LTS version)
Oracle Database XE and Oracle SQL Developer
Installation
Clone the repository
bash
git clone https://github.com/amalcaziiz/Car-Rental-Management-System.git
cd Car-Rental-Management-System
Create the database objects. Open sql/car_rental_schema.sql in SQL Developer, connected as your database user, and run it as a script (F5). This creates the tables, triggers, procedures, and sample data.
Configure your environment. Copy .env.example to .env and fill in your own database details.
Install dependencies and start the server
bash
cd backend
npm install
node server.js
Open the app at http://localhost:8080
Demo Login (sample data only)
Role	Username	Password
Admin	admin1	1234
Staff	staff1	1234
