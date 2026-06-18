let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let taskCounter = 0;

const CAT_COLORS = {
  work: 'cat-work', personal: 'cat-personal',
  urgent: 'cat-urgent', learning: 'cat-learning', other: 'cat-other'
};

const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const titleInput = document.getElementById('titleInput');
const catSelect = document.getElementById('catSelect');
const addTaskBtn = document.getElementById('addTaskBtn');
const searchInput = document.getElementById('searchInput');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');
const pendingCount = document.getElementById('pendingCount');
const doneCount = document.getElementById('doneCount');
const attrPropNote = document.getElementById('attrPropNote');

function createTaskCard(task) {
  const frag = document.createDocumentFragment();

  const card = document.createElement('div');
  card.className = 'task-card';

  card.setAttribute('data-id', task.id);
  card.setAttribute('data-status', task.status);
  card.setAttribute('data-category', task.category);

  card.innerHTML = `
    <div class="task-check" title="Toggle complete">✓</div>
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <input class="task-edit-input" type="text" value="${escapeHtml(task.title)}" maxlength="80">
      <div class="task-meta">
        <span class="task-id">#${task.id}</span>
        <span class="cat-badge ${CAT_COLORS[task.category] || 'cat-other'}">${task.category}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="task-btn edit"   data-action="edit">  ✏ Edit</button>
      <button class="task-btn save"   data-action="save">  ✔ Save</button>
      <button class="task-btn done"   data-action="complete">✓ Done</button>
      <button class="task-btn delete" data-action="delete">  ✕ Del</button>
    </div>
  `;

  frag.appendChild(card);
  return frag;
}

function addTask() {
  const titleProp = titleInput.value.trim();
  const titleAttr = titleInput.getAttribute('value') ?? '(none)';



  if (!titleProp) {
    titleInput.focus();
    titleInput.style.borderColor = 'var(--danger)';
    setTimeout(() => titleInput.style.borderColor = '', 800);
    return;
  }

  taskCounter++;
  const task = {
    id: `T${String(taskCounter).padStart(3,'0')}`,
    title: titleProp,
    category: catSelect.value,
    status: 'pending'
  };
  tasks.unshift(task);
  saveToStorage();
  renderTasks();

  titleInput.value = '';
  titleInput.focus();
  updateCounters();
}

function renderTasks() {
  const q = searchQuery.toLowerCase();

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (currentFilter === 'all') return true;
    if (currentFilter === 'completed') return t.status === 'completed';
    return t.category === currentFilter;
  });

  const frag = document.createDocumentFragment();

  if (filtered.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'empty-state';
    msg.innerHTML = `<span class="empty-icon">🔍</span>${
      searchQuery ? `No tasks match "<strong>${escapeHtml(searchQuery)}</strong>"` : 'No tasks here yet!'
    }`;
    frag.appendChild(msg);
  } else {
    filtered.forEach(task => {
      frag.appendChild(createTaskCard(task));
    });
  }

  taskList.replaceChildren(frag);
  updateCounters();
}

taskList.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  const check = e.target.closest('.task-check');
  const card = e.target.closest('.task-card');

  if (!card) return;

  const id = card.getAttribute('data-id');
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return;

  if (check) {
    toggleComplete(card, taskIndex);
    return;
  }
  if (!btn) return;

  const action = btn.getAttribute('data-action');

  switch (action) {
    case 'edit': startEdit(card); break;
    case 'save': saveEdit(card, taskIndex); break;
    case 'complete': toggleComplete(card, taskIndex); break;
    case 'delete': deleteTask(card, taskIndex); break;
  }
});

function startEdit(card) {
  card.classList.add('editing');
  const inp = card.querySelector('.task-edit-input');
  inp.focus();
  inp.select();
  inp.onkeydown = (e) => { if (e.key === 'Enter') card.querySelector('[data-action="save"]').click(); };
}

function saveEdit(card, idx) {
  const inp = card.querySelector('.task-edit-input');
  const newVal = inp.value.trim();
  if (!newVal) return;

  tasks[idx].title = newVal;
  card.querySelector('.task-title').textContent = newVal;
  card.classList.remove('editing');
  saveToStorage();
  updateCounters();
}

function toggleComplete(card, idx) {
  const current = tasks[idx].status;
  const next = current === 'completed' ? 'pending' : 'completed';
  tasks[idx].status = next;

  card.setAttribute('data-status', next);
  saveToStorage();
  updateCounters();
}

function deleteTask(card, idx) {
  card.style.transition = 'opacity .2s, transform .2s';
  card.style.opacity = '0';
  card.style.transform = 'translateX(20px)';
  setTimeout(() => {
    tasks.splice(idx, 1);
    card.removeAttribute('data-id');
    card.remove();
    saveToStorage();
    updateCounters();
    if (tasks.length === 0) renderTasks();
  }, 200);
}

function clearAllTasks() {
  tasks = [];
  saveToStorage();
  renderTasks();
}

function updateCounters() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'completed').length;
  const pending = total - done;
  pendingCount.textContent = `${pending} pending`;
  doneCount.textContent = `${done} done`;
}

addTaskBtn.addEventListener('click', addTask);

titleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTasks();
});

document.querySelector('.controls-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderTasks();
});

clearAllBtn.addEventListener('click', () => {
  if (tasks.length && confirm('Clear all tasks?')) clearAllTasks();
});

themeToggle.addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', next);
  themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
  themeLabel.textContent = next === 'dark' ? 'Light' : 'Dark';

  localStorage.setItem('taskflow-theme', next);
});

let propMode = 'bubble'; 
const grandparent = document.getElementById('grandparent');
const parent = document.getElementById('parent');
const childBtn = document.getElementById('childBtn');
const propLog = document.getElementById('propLog');
const bubbleBtn = document.getElementById('bubbleBtn');
const captureBtn = document.getElementById('captureBtn');

let gpListener, pListener, chListener;

function flashEl(el) {
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 400);
}

function logEntry(step, nodeClass, nodeLabel, phase) {
  return `<div class="log-entry">
    <span class="log-step">${step}.</span>
    <span class="log-node ${nodeClass}">${nodeLabel}</span>
    <span style="color:var(--muted)">→ fired (${phase} phase)</span>
  </div>`;
}

function attachPropListeners() {
  const useCapture = (propMode === 'capture');

  gpListener = function(e) {
    flashEl(grandparent);
  };
  pListener = function(e) {
    flashEl(parent);
  };
  chListener = function(e) {
    flashEl(childBtn);
    e.stopPropagation();
    let order;
    if (propMode === 'bubble') {
      order = [
        logEntry(1, 'ch', 'Child', 'bubble'),
        logEntry(2, 'p', 'Parent', 'bubble'),
        logEntry(3, 'gp', 'Grandparent', 'bubble'),
      ];
    } else {
      order = [
        logEntry(1, 'gp', 'Grandparent', 'capture'),
        logEntry(2, 'p', 'Parent', 'capture'),
        logEntry(3, 'ch', 'Child', 'capture'),
      ];
    }
    propLog.innerHTML = order.join('');

    if (propMode === 'bubble') {
      setTimeout(() => flashEl(parent), 100);
      setTimeout(() => flashEl(grandparent), 200);
    }
  };

  grandparent.addEventListener('click', gpListener, useCapture);
  parent.addEventListener('click', pListener, useCapture);
  childBtn.addEventListener('click', chListener, useCapture);
}

function detachPropListeners() {
  ['bubble','capture'].forEach(cap => {
    const uc = cap === 'capture';
    if (gpListener) grandparent.removeEventListener('click', gpListener, uc);
    if (pListener) parent.removeEventListener('click', pListener, uc);
    if (chListener) childBtn.removeEventListener('click', chListener, uc);
  });
}

function switchPropMode(mode) {
  detachPropListeners();
  propMode = mode;
  attachPropListeners();
  propLog.innerHTML = `<span class="log-placeholder">Mode: <strong>${mode.toUpperCase()}</strong> — click the button to see the firing order</span>`;
}

bubbleBtn.addEventListener('click', () => {
  bubbleBtn.classList.add('active');
  captureBtn.classList.remove('active');
  switchPropMode('bubble');
});
captureBtn.addEventListener('click', () => {
  captureBtn.classList.add('active');
  bubbleBtn.classList.remove('active');
  switchPropMode('capture');
});

attachPropListeners();

const PIPELINE_STEPS = [
  { cls: 'html-step', icon: '📄', name: 'HTML Source', desc: 'Raw bytes received from server' },
  { arrow: true },
  { cls: 'parse-step', icon: '🔤', name: 'Tokenization', desc: 'Bytes → tokens (tags, attrs, text)' },
  { arrow: true },
  { cls: 'parse-step', icon: '🌳', name: 'Parsing', desc: 'Tokens → node objects' },
  { arrow: true },
  { cls: 'dom-step', icon: '🏗️', name: 'DOM Tree', desc: 'Structured document object model' },
];
const CSS_PIPELINE = [
  { cls: 'css-step', icon: '🎨', name: 'CSS Source', desc: 'Stylesheets parsed in parallel' },
  { arrow: true },
  { cls: 'cssom-step', icon: '🌿', name: 'CSSOM Tree', desc: 'CSS object model built' },
];

const pipeFlow = document.getElementById('pipelineFlow');

function buildPipeStep(step) {
  if (step.arrow) {
    const a = document.createElement('div');
    a.className = 'pipe-arrow';
    a.textContent = '→';
    return a;
  }
  const el = document.createElement('div');
  el.className = `pipe-step ${step.cls}`;
  el.innerHTML = `<div class="pipe-icon">${step.icon}</div>
    <div class="pipe-name">${step.name}</div>
    <div class="pipe-desc">${step.desc}</div>`;
  return el;
}

const pipeFrag = document.createDocumentFragment();
PIPELINE_STEPS.forEach(s => pipeFrag.appendChild(buildPipeStep(s)));
pipeFlow.appendChild(pipeFrag);



function saveToStorage() {
  try {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
    localStorage.setItem('taskflow-counter', String(taskCounter));
  } catch(e) {}
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('taskflow-tasks');
    if (saved) {
      tasks = JSON.parse(saved);
      taskCounter = parseInt(localStorage.getItem('taskflow-counter') || '0', 10);
    }
    const theme = localStorage.getItem('taskflow-theme');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeLabel.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }
  } catch(e) {}
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

loadFromStorage();
renderTasks();

if (tasks.length === 0) {
  const seeds = [];
  seeds.forEach(s => {
    taskCounter++;
    tasks.unshift({ id: `T${String(taskCounter).padStart(3,'0')}`, title: s.title, category: s.category, status: 'pending' });
  });
  saveToStorage();
  renderTasks();
}