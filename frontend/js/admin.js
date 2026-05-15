import { approvePost, deletePost, getPendingPosts, rejectPost } from "./api.js";

const tokenInput = document.getElementById("admin-token");
const form = document.getElementById("token-form");
const message = document.getElementById("admin-message");
const list = document.getElementById("pending-posts");

tokenInput.value = sessionStorage.getItem("adminToken") || "";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadPending() {
  const token = tokenInput.value.trim();
  if (!token) {
    message.textContent = "Token admin wajib diisi.";
    return;
  }

  sessionStorage.setItem("adminToken", token);
  message.textContent = "Memuat submission pending...";
  list.innerHTML = "";

  try {
    const posts = await getPendingPosts(token);
    message.textContent = posts.length ? `${posts.length} artikel menunggu review.` : "Tidak ada artikel pending.";
    list.innerHTML = posts.map(renderPost).join("");
  } catch (error) {
    message.textContent = error.message;
  }
}

function renderPost(post) {
  return `
    <article class="admin-card" data-id="${post.id}">
      <h2>${escapeHtml(post.title)}</h2>
      <div class="admin-meta">${escapeHtml(post.category || "-")} - ${escapeHtml(post.location || "-")} - ${escapeHtml(post.author_name || "-")}</div>
      <p class="admin-excerpt">${escapeHtml(post.content || post.excerpt || "").slice(0, 280)}</p>
      <div class="admin-actions">
        <button class="admin-btn" data-action="approve">Approve</button>
        <button class="admin-btn secondary" data-action="reject">Reject</button>
        <button class="admin-btn danger" data-action="delete">Delete</button>
      </div>
    </article>
  `;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadPending();
});

list.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  const card = event.target.closest("[data-id]");
  if (!button || !card) {
    return;
  }

  const token = tokenInput.value.trim();
  const id = card.dataset.id;
  const action = button.dataset.action;

  button.disabled = true;
  try {
    if (action === "approve") {
      await approvePost(token, id);
    } else if (action === "reject") {
      const reason = prompt("Alasan reject:");
      if (!reason) {
        button.disabled = false;
        return;
      }
      await rejectPost(token, id, reason);
    } else if (action === "delete") {
      await deletePost(token, id);
    }
    await loadPending();
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
  }
});
