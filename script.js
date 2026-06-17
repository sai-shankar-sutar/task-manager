const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskCategory = document.querySelector("#taskCategory");
const taskContainer = document.querySelector("#taskContainer");
const themeToggle = document.querySelector("#themeToggle");

let taskId = 2;

console.log(taskTitle.value);
console.log(taskTitle.getAttribute("placeholder"));

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = taskTitle.value.trim();
  const category = taskCategory.value;

  if (!title) {
    alert("Please enter a task title");
    return;
  }

  createTask(title, category);

  taskTitle.value = "";
});

function createTask(title, category) {
  const card = document.createElement("div");

  card.classList.add("task-card");

  card.setAttribute("data-id", taskId++);
  card.setAttribute("data-status", "pending");
  card.setAttribute("data-category", category);

  card.innerHTML = `
    <div class="task-content">
      <h3>${title}</h3>
      <span class="category-badge">${category}</span>
    </div>

    <div class="task-actions">
      <button class="edit-btn">Edit</button>
      <button class="complete-btn">Complete</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;

  taskContainer.append(card);
}

taskContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".task-card");

  if (!card) return;

  if (e.target.classList.contains("delete-btn")) {
    card.remove();
  }

  if (e.target.classList.contains("complete-btn")) {
    card.classList.toggle("completed");

    const currentStatus = card.dataset.status;

    card.dataset.status =
      currentStatus === "completed"
        ? "pending"
        : "completed";
  }

  if (e.target.classList.contains("edit-btn")) {
    const heading = card.querySelector("h3");

    const updatedTitle = prompt(
      "Edit task:",
      heading.textContent
    );

    if (updatedTitle && updatedTitle.trim()) {
      heading.textContent = updatedTitle.trim();
    }
  }
});

const theme=document.querySelector(".theme-btn");

themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");

  if (currentTheme === "light") {
    document.body.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️ Light Mode";
    theme.style.backgroundColor = "white";
    theme.style.color="black";
  
  } else {
    document.body.setAttribute("data-theme", "light");
    themeToggle.textContent = "🌙 Dark Mode";
    theme.style.backgroundColor = "#111827";
    theme.style.color=" white"
  }
});

console.log(document.body.hasAttribute("data-theme"));
console.log(document.body.getAttribute("data-theme"));

document.body.setAttribute("data-app", "task-manager");
document.body.removeAttribute("data-app");