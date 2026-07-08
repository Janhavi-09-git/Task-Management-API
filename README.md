# Taskflow API - RESTful Task Management System

Taskflow API is a robust, production-ready RESTful CRUD API designed for project and task tracking. It includes a persistent relational database backend, strict request validation schemas, centralized error-handling middleware, a Postman collection for automated testing, and a sleek Kanban-board dashboard interface.

---

## 🚀 Key Features

- **Full RESTful CRUD Design**: Standard mapping of CRUD actions to clean HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) with appropriate status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `422 Unprocessable Entity`).
- **SQLAlchemy ORM & SQLite**: Persistence layer backed by an SQLite relational database utilizing Python's SQLAlchemy ORM for database queries and migrations.
- **Strict Payload Validation**: Input validation middleware powered by Marshmallow schemas ensuring strict compliance on field lengths, allowed enums (e.g. status: `Todo`/`In Progress`/`Done`), and ISO-8601 date validation.
- **Global Error Middleware**: Centralized error interceptors returning clean, predictable JSON error payloads during client failures.
- **Premium Kanban Dashboard**: Interactive frontend dashboard reflecting the task database. Employs HTML5 Drag and Drop APIs to migrate task statuses, priority filter views, responsive CSS grid grids, and live validation responses.
- **Postman Integration**: Exported API testing collection file included in the root folder for immediate endpoint verification.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, Flask-SQLAlchemy (SQLite), Flask-CORS, Marshmallow
- **Frontend**: HTML5 (Drag & Drop APIs), CSS3 (Flexbox/Grid, Ambient glows), JavaScript (ES6 fetch)
- **Testing**: Postman Collection (v2.1.0)

---

## 📂 Project Structure

```text
task_management_api/
├── frontend/
│   ├── index.html          # Kanban Dashboard Page
│   ├── style.css           # Premium Dark Board CSS
│   └── script.js           # API Connector & Card Drag-Drop
├── app.py                  # Main Flask App & Routing
├── database.py             # SQLAlchemy models & Seed Data
├── schemas.py              # Marshmallow Input Validation
├── postman_collection.json # Ready-to-import Postman collection
└── README.md               # Documentation
```

---

## ⚡ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/task-management-api.git
cd task-management-api
```

### 2. Install dependencies
Ensure Python is installed, then run:
```bash
pip install flask flask-sqlalchemy flask-cors marshmallow
```

### 3. Run the Flask Server
Launch the backend server:
```bash
python app.py
```
The server will start on `http://127.0.0.1:5000` and automatically create the SQLite file (`tasks.db`), seeding it with a set of realistic initial tasks.

- Open `http://127.0.0.1:5000` in your browser to view the Kanban Dashboard.
- Access the REST endpoint collection at `http://127.0.0.1:5000/api/tasks`.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description | Sample Query Params |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Get all tasks (sorted by due date) | `?status=Todo` or `?priority=High` |
| **GET** | `/api/tasks/<id>` | Fetch a single task by ID | None |
| **POST** | `/api/tasks` | Create a new task (Validates payload) | None |
| **PUT** | `/api/tasks/<id>` | Update an existing task (Partial update) | None |
| **DELETE** | `/api/tasks/<id>` | Delete a task | None |

### Sample Validation Failure Response (`422 Unprocessable Entity`)
If an invalid payload is sent (e.g. status matches incorrect option, or due_date format is wrong):
```json
{
  "error": "Unprocessable Entity",
  "status_code": 422,
  "message": "Input validation failed.",
  "details": {
    "due_date": [
      "Due date must be in ISO format (YYYY-MM-DD)."
    ],
    "status": [
      "Status must be one of: 'Todo', 'In Progress', 'Done'."
    ]
  }
}
```

---

## 📮 Postman Testing Guide

1. Open your **Postman** desktop application.
2. Click **Import** in the top left header bar.
3. Drag & drop the file `postman_collection.json` located in the project root.
4. Set up an environment or test immediately using the pre-loaded local variable `{{base_url}}` (defaults to `http://127.0.0.1:5000`).
5. Open the folder and run individual test requests (GET, POST with error validation, PUT, DELETE).
