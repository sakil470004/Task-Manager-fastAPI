let token = "";
let editingTaskId = null;
let isLoginMode = true;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const savedToken = localStorage.getItem("token");
  if (savedToken) {
    token = savedToken;
    showTasksSection();
    loadTasks();
  }
});

// Toggle between login and register forms
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  
  if (isLoginMode) {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    clearAuthForms();
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    clearAuthForms();
  }
}

// Clear all auth forms
function clearAuthForms() {
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("registerUsername").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
}

// Toggle between auth and tasks sections
function showAuthSection() {
  document.getElementById("authSection").classList.remove("hidden");
  document.getElementById("tasksSection").classList.add("hidden");
}

function showTasksSection() {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("tasksSection").classList.remove("hidden");
}

// Login
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      alert("Login failed. Check your credentials.");
      return;
    }

    const data = await res.json();
    token = data.access_token;
    localStorage.setItem("token", token);
    clearAuthForms();
    showTasksSection();
    loadTasks();
  } catch (error) {
    alert("Error logging in: " + error.message);
  }
}

// Register
async function register() {
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if (!username || !email || !password) {
    alert("Please fill in all fields");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert("Registration failed: " + (errorData.detail || "Unknown error"));
      return;
    }

    alert("Registration successful! Please login.");
    toggleAuthMode();
    clearAuthForms();
  } catch (error) {
    alert("Error registering: " + error.message);
  }
}

// Logout
function logout() {
  token = "";
  localStorage.removeItem("token");
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  isLoginMode = true;
  clearAuthForms();
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  showAuthSection();
}

// Create task
async function createTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title) {
    alert("Please enter a task title");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/tasks/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        title,
        description: description || null
      })
    });

    if (!res.ok) {
      alert("Failed to create task");
      return;
    }

    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    loadTasks();
  } catch (error) {
    alert("Error creating task: " + error.message);
  }
}

// Load tasks
async function loadTasks() {
  try {
    const res = await fetch("http://127.0.0.1:8000/tasks/", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      alert("Failed to load tasks");
      return;
    }

    const tasks = await res.json();
    const taskList = document.getElementById("tasks");
    const emptyState = document.getElementById("emptyState");

    taskList.innerHTML = "";

    if (tasks.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
    }

    document.getElementById("taskCount").textContent = `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;

    tasks.forEach(task => {
      const taskEl = document.createElement("div");
      taskEl.className = "flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group";
      
      const isCompleted = task.completed || false;
      
      taskEl.innerHTML = `
        <input 
          type="checkbox" 
          ${isCompleted ? "checked" : ""} 
          onchange="toggleComplete(${task.id}, ${isCompleted})"
          class="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mt-1 flex-shrink-0"
        >
        <div class="flex-1 min-w-0">
          <div class="${isCompleted ? "line-through text-gray-400" : "text-gray-800"} font-medium">
            ${escapeHtml(task.title)}
          </div>
          ${task.description ? `<div class="${isCompleted ? "line-through text-gray-400" : "text-gray-600"} text-sm mt-1">
            ${escapeHtml(task.description)}
          </div>` : ""}
        </div>
        <button 
          onclick="openEditModal(${task.id}, '${escapeHtml(task.title).replace(/'/g, "\\'")}', '${task.description ? escapeHtml(task.description).replace(/'/g, "\\'") : ""}', ${isCompleted})" 
          class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded opacity-0 group-hover:opacity-100 transition flex-shrink-0"
        >
          Edit
        </button>
        <button 
          onclick="deleteTask(${task.id})" 
          class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition flex-shrink-0"
        >
          Delete
        </button>
      `;
      
      taskList.appendChild(taskEl);
    });
  } catch (error) {
    alert("Error loading tasks: " + error.message);
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      alert("Failed to delete task");
      return;
    }

    loadTasks();
  } catch (error) {
    alert("Error deleting task: " + error.message);
  }
}

// Toggle complete (true/false toggle)
async function toggleComplete(taskId, isCurrentlyCompleted) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ completed: !isCurrentlyCompleted })
    });

    if (!res.ok) {
      alert("Failed to update task");
      return;
    }

    loadTasks();
  } catch (error) {
    alert("Error updating task: " + error.message);
  }
}

// Edit modal
function openEditModal(taskId, title, description, completed) {
  editingTaskId = taskId;
  document.getElementById("editTitle").value = title;
  document.getElementById("editDescription").value = description || "";
  document.getElementById("editCompleted").checked = completed || false;
  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  editingTaskId = null;
}

async function saveEdit() {
  const newTitle = document.getElementById("editTitle").value.trim();
  const newDescription = document.getElementById("editDescription").value.trim();
  const isCompleted = document.getElementById("editCompleted").checked;

  if (!newTitle) {
    alert("Task title cannot be empty");
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:8000/tasks/${editingTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        title: newTitle,
        description: newDescription || null,
        completed: isCompleted
      })
    });

    if (!res.ok) {
      alert("Failed to update task");
      return;
    }

    closeEditModal();
    loadTasks();
  } catch (error) {
    alert("Error updating task: " + error.message);
  }
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function saveEdit() {
  const newTitle = document.getElementById("editTitle").value.trim();

  if (!newTitle) {
    alert("Task title cannot be empty");
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:8000/tasks/${editingTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle })
    });

    if (!res.ok) {
      alert("Failed to update task");
      return;
    }

    closeEditModal();
    loadTasks();
  } catch (error) {
    alert("Error updating task: " + error.message);
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}