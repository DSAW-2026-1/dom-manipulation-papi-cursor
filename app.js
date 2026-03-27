const STORAGE_KEY = "todo_tasks_v1";

/** @typedef {{ id: string, title: string, completed: boolean, createdAt: number }} Task */

const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const clearCompletedButton = document.getElementById("clearCompletedButton");
const taskList = document.getElementById("taskList");
const itemsLeft = document.getElementById("itemsLeft");
const emptyState = document.getElementById("emptyState");

/** @type {Task[]} */
let tasks = loadTasks();

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: String(t.id ?? generateId()),
        title: String(t.title ?? ""),
        completed: Boolean(t.completed),
        createdAt: Number(t.createdAt ?? Date.now()),
      }))
      .filter((t) => t.title.trim().length > 0);
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render() {
  taskList.replaceChildren();

  for (const task of tasks) {
    taskList.appendChild(createTaskElement(task));
  }

  const leftCount = tasks.reduce((acc, t) => acc + (t.completed ? 0 : 1), 0);
  itemsLeft.textContent = String(leftCount);

  const hasAny = tasks.length > 0;
  emptyState.hidden = hasAny;
  clearCompletedButton.disabled = tasks.every((t) => !t.completed);
}

/**
 * @param {Task} task
 */
function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task${task.completed ? " is-completed" : ""}`;
  item.dataset.taskId = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task__checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "Mark task as completed");
  checkbox.addEventListener("change", () => {
    toggleCompleted(task.id, checkbox.checked);
  });

  const title = document.createElement("span");
  title.className = "task__title";
  title.textContent = task.title;
  title.tabIndex = 0;
  title.setAttribute("role", "textbox");
  title.setAttribute("aria-label", "Task title. Double click to edit.");

  title.addEventListener("dblclick", () => {
    startInlineEdit(task.id, title);
  });
  title.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      startInlineEdit(task.id, title);
    }
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button button--danger";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", "Delete task");
  deleteButton.addEventListener("click", () => {
    deleteTask(task.id);
  });

  item.append(checkbox, title, deleteButton);
  return item;
}

function addTask(title) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;

  tasks.unshift({
    id: generateId(),
    title: cleanTitle,
    completed: false,
    createdAt: Date.now(),
  });

  saveTasks();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter((t) => t.id !== taskId);
  saveTasks();
  render();
}

function toggleCompleted(taskId, completed) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.completed = completed;
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

function startInlineEdit(taskId, titleElement) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = task.title;
  input.className = "composer__input";
  input.style.minHeight = "40px";

  const commit = () => {
    const newTitle = input.value.trim();
    if (!newTitle) {
      deleteTask(taskId);
      return;
    }
    task.title = newTitle;
    saveTasks();
    render();
  };

  const cancel = () => {
    render();
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") commit();
    if (event.key === "Escape") cancel();
  });
  input.addEventListener("blur", commit);

  titleElement.replaceWith(input);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

addTaskButton.addEventListener("click", () => {
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTaskButton.click();
  }
});

clearCompletedButton.addEventListener("click", clearCompleted);

render();
