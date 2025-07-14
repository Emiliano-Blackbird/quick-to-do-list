class Task {
  constructor(id, text, completed = false) {
    this.id = id;
    this.text = text;
    this.completed = completed;
  }
}

class UI {
  static init() {
    UI.loadTheme();                // Aplica tema si ya está guardado
    UI.loadTasksFromLocal();       // Carga tareas guardadas
    UI.bindEvents();               // Enlaza eventos
  }

  static bindEvents() {
    document.getElementById('task-form')
      .addEventListener('submit', UI.handleAdd);

    document.querySelectorAll('.filter-btn')
      .forEach(btn => btn.addEventListener('click', UI.handleFilter));

    document.getElementById('dark-toggle')
      .addEventListener('click', UI.toggleTheme);
  }

  static loadTasksFromLocal() {
    const tasks = Store.getTasks();
    tasks.forEach(task => UI.addTaskToList(task));
  }

  static handleAdd(e) {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;

    const task = new Task(Date.now().toString(), text);
    Store.addTask(task);
    UI.addTaskToList(task, true);
    input.value = '';
  }

  static handleFilter(e) {
    document.querySelectorAll('.filter-btn')
      .forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    UI.renderFiltered(e.target.dataset.filter);
  }

  static renderFiltered(filter) {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    Store.getTasks()
      .filter(t => {
        if (filter === 'all') return true;
        if (filter === 'completed') return t.completed;
        if (filter === 'pending') return !t.completed;
      })
      .forEach(task => UI.addTaskToList(task));
  }

  static addTaskToList(task, animate = false) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.classList.add('completed');
    li.dataset.id = task.id;
    if (animate) li.classList.add('enter');

    li.innerHTML = `
      <label>
        <input type="checkbox" class="task-check" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
      </label>
      <button class="delete-btn" title="Eliminar">×</button>
    `;

    // Evento: toggle tarea
    li.querySelector('.task-check')
      .addEventListener('change', () => UI.toggleComplete(task.id, li));

    // Evento: eliminar
    li.querySelector('.delete-btn')
      .addEventListener('click', () => UI.removeTask(task.id, li));

    // Swipe para eliminar (touch)
    let startX;
    li.addEventListener('touchstart', e => {
      startX = e.changedTouches[0].pageX;
    });
    li.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].pageX - startX;
      if (Math.abs(diff) > 100) UI.removeTask(task.id, li);
    });

    document.getElementById('task-list').appendChild(li);
    li.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  static toggleComplete(id, li) {
    Store.toggleTask(id);
    li.classList.toggle('completed');
  }

  static removeTask(id, li) {
    if (li.classList.contains('exit')) return; // Ya se está borrando
    li.classList.add('exit');
    li.addEventListener('animationend', () => {
      Store.removeTask(id);
      li.remove();
    });
  }

  // Modo oscuro
  static toggleTheme() {
    const body = document.body;
    const dark = body.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    document.getElementById('dark-toggle').textContent = dark ? '☀️' : '🌙';
  }

  static loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.body.classList.add('dark');
      document.getElementById('dark-toggle').textContent = '☀️';
    }
  }
}

class Store {
  static getTasks() {
    return JSON.parse(localStorage.getItem('tasks') || '[]');
  }

  static addTask(task) {
    const tasks = Store.getTasks();
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  static removeTask(id) {
    let tasks = Store.getTasks();
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  static toggleTask(id) {
    const tasks = Store.getTasks();
    tasks.forEach(t => {
      if (t.id === id) t.completed = !t.completed;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', UI.init);

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(err => console.error('ServiceWorker no registrado:', err));
  });
}
