
import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from marshmallow import ValidationError

from database import db, Task, init_db
from schemas import TaskCreateSchema, TaskUpdateSchema

app = Flask(__name__)

# Basic Config
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'tasks.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

# Enable CORS for cross-origin API invocation
CORS(app)

# Initialize database
init_db(app)

# Initialize validation schemas
create_schema = TaskCreateSchema()
update_schema = TaskUpdateSchema()

# ==========================================================================
   # ERROR HANDLERS (MIDDLEWARE)
   # ==========================================================================
@app.errorhandler(ValidationError)
def handle_validation_error(err):
    """Global handler for payload schema validation errors."""
    return jsonify({
        'error': 'Unprocessable Entity',
        'status_code': 422,
        'message': 'Input validation failed.',
        'details': err.messages
    }), 422

@app.errorhandler(400)
def bad_request(err):
    return jsonify({
        'error': 'Bad Request',
        'status_code': 400,
        'message': str(err.description)
    }), 400

@app.errorhandler(404)
def not_found(err):
    return jsonify({
        'error': 'Not Found',
        'status_code': 404,
        'message': 'The requested resource could not be found.'
    }), 404

@app.errorhandler(405)
def method_not_allowed(err):
    return jsonify({
        'error': 'Method Not Allowed',
        'status_code': 405,
        'message': 'The HTTP method is not allowed for the requested endpoint.'
    }), 405

@app.errorhandler(500)
def internal_server_error(err):
    return jsonify({
        'error': 'Internal Server Error',
        'status_code': 500,
        'message': 'An unexpected error occurred on the server.'
    }), 500


# ==========================================================================
   # REST API ROUTES
   # ==========================================================================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Retrieve all tasks with optional filtering by status or priority."""
    query = Task.query

    # Apply filters from query params
    status_filter = request.args.get('status')
    if status_filter:
        query = query.filter(Task.status == status_filter)

    priority_filter = request.args.get('priority')
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)

    # Order tasks by due date (nulls last)
    tasks = query.order_by(Task.due_date.asc()).all()
    return jsonify([task.to_json() for task in tasks]), 200


@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Retrieve a single task by ID."""
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_json()), 200


@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task with JSON payload validation."""
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'Bad Request', 'message': 'No input data provided.'}), 400

    # Validate payload
    data = create_schema.load(json_data)

    # Process tags (list -> comma-separated string)
    tags_list = data.get('tags', '')
    if isinstance(tags_list, list):
        tags_str = ','.join([str(t).strip() for t in tags_list])
    else:
        tags_str = str(tags_list).strip()

    new_task = Task(
        title=data['title'].strip(),
        description=data.get('description', '').strip(),
        status=data.get('status', 'Todo'),
        priority=data.get('priority', 'Medium'),
        due_date=data.get('due_date'),
        tags=tags_str
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.to_json()), 201


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update attributes of an existing task with partial schema validation."""
    task = Task.query.get_or_404(task_id)
    
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'Bad Request', 'message': 'No input data provided.'}), 400

    # Validate payload (partials allowed)
    data = update_schema.load(json_data, partial=True)

    if 'title' in data:
        task.title = data['title'].strip()
    if 'description' in data:
        task.description = data['description'].strip()
    if 'status' in data:
        task.status = data['status']
    if 'priority' in data:
        task.priority = data['priority']
    if 'due_date' in data:
        task.due_date = data['due_date']
    if 'tags' in data:
        tags_val = data['tags']
        if isinstance(tags_val, list):
            task.tags = ','.join([str(t).strip() for t in tags_val])
        else:
            task.tags = str(tags_val).strip()

    db.session.commit()
    return jsonify(task.to_json()), 200


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task and return confirmation."""
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': f'Task #{task_id} successfully deleted.'}), 200


# ==========================================================================
   # FRONTEND MOUNTING
   # ==========================================================================
@app.route('/')
def index():
    """Serves the static web Kanban dashboard if available."""
    frontend_path = os.path.join(os.path.dirname(__file__), 'frontend', 'index.html')
    if os.path.exists(frontend_path):
        with open(frontend_path, 'r', encoding='utf-8') as f:
            return f.read()
    return jsonify({
        'message': 'RESTful Task Management API is online.',
        'documentation_route': '/api/tasks (GET, POST)'
    })

# Serve other static files (css, js)
@app.route('/<path:path>')
def static_proxy(path):
    static_file_path = os.path.join(os.path.dirname(__file__), 'frontend', path)
    if os.path.exists(static_file_path):
        with open(static_file_path, 'rb') as f:
            content = f.read()
        
        # Simple content-type resolver
        ext = os.path.splitext(path)[1]
        mimetypes = {
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.html': 'text/html'
        }
        response = make_response(content)
        response.headers['Content-Type'] = mimetypes.get(ext, 'text/plain')
        return response
    return jsonify({'error': 'File Not Found'}), 404


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
