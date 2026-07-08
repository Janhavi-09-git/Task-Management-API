from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime

def validate_date_string(val):
    """Custom validator to ensure due_date matches YYYY-MM-DD pattern."""
    if not val:
        return
    try:
        datetime.strptime(val, "%Y-%m-%d")
    except ValueError:
        raise ValidationError("Due date must be in ISO format (YYYY-MM-DD).")

class TaskCreateSchema(Schema):
    title = fields.String(
        required=True,
        validate=[
            validate.Length(min=3, max=100, error="Title must be between 3 and 100 characters."),
            validate.NoneOf(["", "   "], error="Title cannot be empty whitespace.")
        ]
    )
    description = fields.String(allow_none=True, load_default="")
    status = fields.String(
        validate=validate.OneOf(
            ['Todo', 'In Progress', 'Done'],
            error="Status must be one of: 'Todo', 'In Progress', 'Done'."
        ),
        load_default="Todo"
    )
    priority = fields.String(
        validate=validate.OneOf(
            ['Low', 'Medium', 'High'],
            error="Priority must be one of: 'Low', 'Medium', 'High'."
        ),
        load_default="Medium"
    )
    due_date = fields.String(
        allow_none=True,
        validate=validate_date_string,
        load_default=None
    )
    tags = fields.Raw(allow_none=True, load_default="")  # Can be list of strings or single string

class TaskUpdateSchema(Schema):
    title = fields.String(
        validate=[
            validate.Length(min=3, max=100, error="Title must be between 3 and 100 characters.")
        ]
    )
    description = fields.String(allow_none=True)
    status = fields.String(
        validate=validate.OneOf(
            ['Todo', 'In Progress', 'Done'],
            error="Status must be one of: 'Todo', 'In Progress', 'Done'."
        )
    )
    priority = fields.String(
        validate=validate.OneOf(
            ['Low', 'Medium', 'High'],
            error="Priority must be one of: 'Low', 'Medium', 'High'."
        )
    )
    due_date = fields.String(
        allow_none=True,
        validate=validate_date_string
    )
    tags = fields.Raw(allow_none=True)
