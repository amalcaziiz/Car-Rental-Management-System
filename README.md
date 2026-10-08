# Car Rental Management System

A full-stack web application designed to manage car rental operations, including vehicles, customers, rentals, payments, staff, and related business processes.

## Overview

The Car Rental Management System combines a JavaScript-based frontend, a Node.js and Express.js backend, and an Oracle SQL/PLSQL database.

The project demonstrates full-stack application development as well as database design and advanced Oracle PL/SQL programming. Business logic is implemented across the application and database layers to support data validation, rental operations, and database-driven workflows.

## Technology Stack

**Frontend**
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- REST-style API endpoints

**Database**
- Oracle Database
- SQL
- PL/SQL

**Development Tools**
- Visual Studio Code
- Git
- GitHub

---

## System Architecture

The application follows a three-layer architecture:

```text
┌─────────────────────────────┐
│          Frontend           │
│      HTML / CSS / JS        │
└──────────────┬──────────────┘
               │
               │ API Requests
               ▼
┌─────────────────────────────┐
│           Backend           │
│     Node.js + Express.js    │
└──────────────┬──────────────┘
               │
               │ Database Queries
               ▼
┌─────────────────────────────┐
│       Oracle Database       │
│       SQL + PL/SQL          │
└─────────────────────────────┘
```

The frontend communicates with the Node.js/Express backend through API endpoints. The backend handles application requests and database communication, while Oracle SQL and PL/SQL provide data management and database-level business logic.

---

## Key Features

- User authentication and role-based access
- Vehicle management
- Customer management
- Rental management
- Payment management
- Staff management
- Vehicle availability and rental status tracking
- Database-driven business rules
- Data validation and exception handling
- Backend API integration
- Oracle PL/SQL business logic

---

## Oracle Database & PL/SQL

The database layer was designed using Oracle SQL and PL/SQL to implement relational data management and business rules.

### Database Schema

- Multiple related tables with primary and foreign key relationships
- Data integrity through `CHECK` and `UNIQUE` constraints
- Sample data for application testing
- Relational database design supported by an Entity Relationship Diagram (ERD)

### Stored Procedures

The system uses stored procedures to implement business operations.

The PL/SQL implementation includes:

- `IN`, `OUT`, and `IN OUT` parameters
- Procedure-to-procedure calls
- Exception handling
- Business operations implemented at the database level

### Stored Functions

Stored functions are used to calculate and return values required by the application.

- Functions can be called from SQL or procedures
- Computed values are returned without modifying database data

### PL/SQL Package

The database includes a PL/SQL package consisting of a specification and body.

The package groups related procedures and functions into a single functional area and provides a structured way to organize database logic.

### Triggers

Database triggers enforce business rules and automate database actions.

The implementation includes:

- `BEFORE` triggers for validation and default values
- `AFTER` triggers for auditing and other database actions
- Business-rule enforcement at the database level

### Cursors, Records & Collections

The project demonstrates advanced PL/SQL features, including:

- Explicit cursors
- Cursor `FOR` loops
- User-defined record types
- `%ROWTYPE` records
- Associative arrays
- Nested tables
- Oracle collection methods such as `EXISTS`, `COUNT`, `FIRST`, `NEXT`, `EXTEND`, and `DELETE`

### Exception Handling

Exception handling is implemented throughout the PL/SQL layer.

The project includes:

- `NO_DATA_FOUND`
- `TOO_MANY_ROWS`
- User-defined exceptions
- Exception handling in procedures and functions

---

## Frontend

The frontend provides the user interface for interacting with the car rental system.

It includes functionality for:

- User authentication
- Dashboard views
- Vehicle management
- Customer management
- Rental operations
- Payment-related functionality
- Communication with backend API endpoints

The frontend uses JavaScript to manage application state, user interactions, and API communication.

---

## Backend

The backend is built with Node.js and Express.js.

It is responsible for:

- Handling HTTP requests
- Providing API endpoints
- Processing application logic
- Communicating with the Oracle database
- Returning data to the frontend
- Supporting authentication and application workflows

---

## My Contribution

I developed the project across the frontend, backend, and database layers.

My work included:

- Building frontend functionality with HTML, CSS, and JavaScript
- Developing backend functionality using Node.js and Express.js
- Designing and implementing Oracle database components
- Writing SQL and PL/SQL database logic
- Connecting the frontend, backend, and database
- Implementing application and database business rules
- Testing and debugging the application

AI-assisted development tools were used during implementation to accelerate development and debugging. I reviewed, tested, modified, and integrated the resulting code as part of the development process.

---

## Project Structure

```text
Car-Rental-Management-System/
│
├── frontend/
│   ├── ...
│   └── ...
│
├── backend/
│   ├── ...
│   └── ...
│
├── database/
│   └── ...
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js
- npm
- Oracle Database
- Git

### Clone the Repository

```bash
git clone https://github.com/amalcaziiz/Car-Rental-Management-System.git
cd Car-Rental-Management-System
```

### Install Dependencies

Navigate to the backend directory and install the required packages:

```bash
npm install
```

### Database Setup

Set up the Oracle database using the SQL and PL/SQL scripts included in the project.

Configure the backend with the appropriate local Oracle database connection settings.

### Run the Application

Start the Node.js/Express backend using the project's configured start command, then open the frontend through the configured development environment.

---

## Project Purpose

This project was developed to apply practical concepts in:

- Full-stack web development
- REST API development
- Relational database design
- Oracle SQL and PL/SQL
- Backend development
- Database business logic
- Application integration
- Software development and debugging

## Repository

GitHub: https://github.com/amalcaziiz/Car-Rental-Management-System
