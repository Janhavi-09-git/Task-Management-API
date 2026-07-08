import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='Todo', nullable=False)  # Todo, In Progress, Done
    priority = db.Column(db.String(15), default='Medium', nullable=False) # Low, Medium, High
    due_date = db.Column(db.String(20), nullable=True) # ISO format string 'YYYY-MM-DD'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tags = db.Column(db.String(200), nullable=True) # Comma-separated strings, e.g., "API,Homework"

    def to_json(self):
        """Helper to convert SQLAlchemy object to JSON-compatible dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'due_date': self.due_date,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'tags': [t.strip() for t in self.tags.split(',')] if self.tags else []
        }

def init_db(app):
    """Binds Flask App to SQLAlchemy and creates tables if they don't exist."""
    db.init_app(app)
    with app.app_context():
        db.create_all()
        # Seed initial data if DB is empty
        if Task.query.count() == 0:
            seed_initial_data()

def seed_initial_data():
    """Seeds some highly realistic initial tasks to show recruiters immediately."""
    tasks = [
        Task(
            title="Design Database Schema",
            description="Sketch the relational schema for the new task management system, ensuring proper indexing on foreign keys.",
            status="Done",
            priority="High",
            due_date="2026-07-01",
            tags="database,planning"
        ),
        Task(
            title="Implement Token Authentication",
            description="Add JWT authentication middleware using PyJWT to secure private task routes.",
            status="In Progress",
            priority="High",
            due_date="2026-07-05",
            tags="security,backend"
        ),
        Task(
            title="Write Unit Tests for Task Endpoints",
            description="Utilize pytest to reach >80% code coverage on task creation and validation endpoints.",
            status="Todo",
            priority="Medium",
            due_date="2026-07-10",
            tags="testing,qa"
        ),
        Task(
            title="Set Up GitHub Actions CI Pipeline",
            description="Create a linting and test execution workflow to trigger on every pull request to main.",
            status="Todo",
            priority="Low",
            due_date="2026-07-15",
            tags="devops,ci"
        )
    ]
    for task in tasks:
        db.session.add(task)
    db.session.commit()
    print("Database pre-populated with seed task items.")
