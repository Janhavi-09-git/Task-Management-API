// Base URL of Flask REST API (defaults to local port 5000)
const API_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'http://127.0.0.1:5000';

// DOM Selectors
const boardTodo = document.getElementById('cards-Todo');
const boardProgress = document.getElementById('cards-In-Progress');
const boardDone = document.getElementById('cards-Done');

const countTodo = document.getElementById('count-Todo');
const countProgress = document.getElementById('count-In-Progress');
const countDone = document.getElementById('count-Done');

const priorityFilter = document.getElementById('priorityFilter');
const openCreateModalBtn = document.getElementById('openCreateModalBtn');
const taskModal = document.getElementById('taskModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const taskForm = document.getElementById('taskForm');

// Form Field Selectors
const modalTitle = document.getElementById('modalTitle');
const taskIdField = document.getElementById('taskIdField');
const titleField = document.getElementById('titleField');
const descField = document.getElementById('descField');
const statusField = document.getElementById('statusField');
const priorityField = document.getElementById('priorityField');
const dueDateField = document.getElementById('dueDateField');
const tagsField = document.getElementById('tagsField');

// Validation Error Selectors
const titleError = document.getElementById('titleError');
const dateError = document.getElementById('dateError');

// Drag and drop tracking
let draggedTaskId = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setupEventListeners();
});

// Fetch tasks from API (supports priority filter)
async function fetchTasks() {
    let url = `${API_URL}/api/tasks`;
    const priority = priorityFilter.value;
    if (priority) {
        url += `?priority=${priority}`;
    }

    try {
        const response = await fetch(url);
        if (response.ok) {
            const tasks = await response.json();
            renderTasks(tasks);
        } else {
            console.error('Failed to retrieve tasks from REST API.');
        }
    } catch (error) {
        console.error('Network error connecting to task API:', error);
    }
}

// Render task list to Kanban Columns
function renderTasks(tasks) {
    // Clear existing cards
    boardTodo.innerHTML = '';
    boardProgress.innerHTML = '';
    boardDone.innerHTML = '';

    const columns = {
        'Todo': { el: boardTodo, countEl: countTodo, count: 0 },
        'In Progress': { el: boardProgress, countEl: countProgress, count: 0 },
        'Done': { el: boardDone, countEl: countDone, count: 0 }
    };

    tasks.forEach(task => {
        const column = columns[task.status] || columns['Todo'];
        column.count++;
        
        const card = createTaskCard(task);
        column.el.appendChild(card);
    });

    // Update Counter Badges
    Object.keys(columns).forEach(status => {
        columns[status].countEl.textContent = columns[status].count;
    });

    setupDragEvents();
}

// Construct a Task Card DOM Element
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority}`;
    card.draggable = true;
    card.dataset.id = task.id;

    // Check if task is overdue
    let isOverdue = false;
    let formattedDate = '';
    if (task.due_date) {
        const today = new Date().setHours(0,0,0,0);
        const due = new Date(task.due_date).setHours(0,0,0,0);
        isOverdue = due < today && task.status !== 'Done';
        
        // Simple human readable date conversion
        const dateObj = new Date(task.due_date);
        formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Build tag chips HTML
    const tagsHtml = task.tags && task.tags.length > 0
        ? task.tags.map(t => `<span class="tag-chip">${escapeHTML(t)}</span>`).join('')
        : '';

    card.innerHTML = `
        <div class="card-header">
            <h3>${escapeHTML(task.title)}</h3>
            <span class="priority-badge prio-${task.priority}">${task.priority}</span>
        </div>
        <div class="card-body">
            <p>${escapeHTML(task.description || 'No description provided.')}</p>
        </div>
        <div class="card-meta">
            ${task.due_date 
                ? `<div class="due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="fa-regular fa-calendar"></i> ${formattedDate}
                   </div>`
                : '<div></div>'
            }
            <div class="card-tags">${tagsHtml}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 8px;">
            <!-- Column shifts for keyboard accessibility -->
            <div class="card-actions">
                <button class="action-btn" onclick="shiftStatus(${task.id}, 'prev')" title="Move back"><i class="fa-solid fa-angle-left"></i></button>
                <button class="action-btn" onclick="shiftStatus(${task.id}, 'next')" title="Move forward"><i class="fa-solid fa-angle-right"></i></button>
            </div>
            <div class="card-actions">
                <button class="action-btn" onclick="openEditModal(${task.id})" title="Edit Task"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn btn-delete" onclick="deleteTask(${task.id})" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>
    `;

    return card;
}

// Setup Event Listeners
function setupEventListeners() {
    priorityFilter.addEventListener('change', fetchTasks);
    openCreateModalBtn.addEventListener('click', openCreateModal);
    
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside card
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });

    taskForm.addEventListener('submit', handleFormSubmit);
}

// Reset validation state
function clearErrors() {
    titleError.textContent = '';
    titleError.style.display = 'none';
    dateError.textContent = '';
    dateError.style.display = 'none';
}

// Open Modal for Create
function openCreateModal() {
    clearErrors();
    modalTitle.textContent = 'Create New Task';
    taskIdField.value = '';
    taskForm.reset();
    
    // Reset defaults
    statusField.value = 'Todo';
    priorityField.value = 'Medium';
    
    taskModal.classList.add('active');
}

// Open Modal for Edit
async function openEditModal(taskId) {
    clearErrors();
    modalTitle.textContent = 'Edit Task';
    taskForm.reset();

    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`);
        if (response.ok) {
            const task = await response.json();
            
            // Populate form
            taskIdField.value = task.id;
            titleField.value = task.title;
            descField.value = task.description || '';
            statusField.value = task.status;
            priorityField.value = task.priority;
            dueDateField.value = task.due_date || '';
            tagsField.value = task.tags ? task.tags.join(', ') : '';

            taskModal.classList.add('active');
        }
    } catch (error) {
        console.error('Error fetching task details:', error);
    }
}

function closeModal() {
    taskModal.classList.remove('active');
    clearErrors();
}

// Submit Form (handles both Create and Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    clearErrors();

    const taskId = taskIdField.value;
    const isEdit = taskId !== '';

    // Build payload
    const tags = tagsField.value
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

    const payload = {
        title: titleField.value.trim(),
        description: descField.value.trim(),
        status: statusField.value,
        priority: priorityField.value,
        due_date: dueDateField.value ? dueDateField.value : null,
        tags: tags
    };

    // Client-side quick checks
    if (payload.title.length < 3) {
        titleError.textContent = 'Title must be at least 3 characters.';
        titleError.style.display = 'block';
        return;
    }

    try {
        const url = isEdit ? `${API_URL}/api/tasks/${taskId}` : `${API_URL}/api/tasks`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeModal();
            fetchTasks();
        } else {
            // Handle validation errors from Flask/Marshmallow API
            const errResult = await response.json();
            if (errResult.details) {
                if (errResult.details.title) {
                    titleError.textContent = errResult.details.title.join(' ');
                    titleError.style.display = 'block';
                }
                if (errResult.details.due_date) {
                    dateError.textContent = errResult.details.due_date.join(' ');
                    dateError.style.display = 'block';
                }
            } else {
                alert(`Error: ${errResult.message || 'Operation failed'}`);
            }
        }
    } catch (error) {
        console.error('Error processing form submit:', error);
    }
}

// Delete Task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to permanently delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
        if (response.ok) {
            fetchTasks();
        } else {
            console.error('Delete operation rejected by server.');
        }
    } catch (error) {
        console.error('Error sending delete request:', error);
    }
}

// Move card status using button controls
async function shiftStatus(taskId, direction) {
    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`);
        if (!response.ok) return;
        
        const task = await response.json();
        const statusFlow = ['Todo', 'In Progress', 'Done'];
        let idx = statusFlow.indexOf(task.status);
        
        if (direction === 'prev' && idx > 0) {
            idx--;
        } else if (direction === 'next' && idx < 2) {
            idx++;
        } else {
            return; // No shift possible
        }

        const updateRes = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: statusFlow[idx] })
        });

        if (updateRes.ok) {
            fetchTasks();
        }
    } catch (error) {
        console.error('Error shifting status:', error);
    }
}

// ==========================================================================
   // HTML5 DRAG AND DROP HANDLERS
   // ==========================================================================
function setupDragEvents() {
    const cards = document.querySelectorAll('.task-card');
    const columns = document.querySelectorAll('.kanban-column');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedTaskId = card.dataset.id;
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', draggedTaskId);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            draggedTaskId = null;
        });
    });

    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault(); // Required to allow drop
        });

        col.addEventListener('dragenter', (e) => {
            e.preventDefault();
            col.classList.add('drag-over');
        });

        col.addEventListener('dragleave', () => {
            col.classList.remove('drag-over');
        });

        col.addEventListener('drop', async (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
            const newStatus = col.dataset.status;

            if (taskId && newStatus) {
                await updateTaskStatus(taskId, newStatus);
            }
        });
    });
}

// Send Status PUT request
async function updateTaskStatus(taskId, status) {
    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });

        if (response.ok) {
            fetchTasks();
        } else {
            console.error('Status drop update rejected by server.');
        }
    } catch (error) {
        console.error('Error updating task status via drop:', error);
    }
}

// Helpers
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
