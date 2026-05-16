import { approvePost, deletePost, getPendingPosts, getReviewedPosts, rejectPost } from "./api.js";
import { currentCanonicalUrl, defaultShareImage, getOgLocale, setLink, setMeta } from "./i18n.js";
import { contentToPlainText } from "./markdown.js";

const REVIEWED_PAGE_SIZE = 10;

const tokenInput = document.getElementById("admin-token");
const form = document.getElementById("token-form");
const message = document.getElementById("admin-message");
const list = document.getElementById("pending-posts");
const reviewedRows = document.getElementById("reviewed-posts");
const reviewedPrev = document.getElementById("reviewed-prev");
const reviewedNext = document.getElementById("reviewed-next");
const reviewedPageLabel = document.getElementById("reviewed-page");

let reviewedPage = 1;
let reviewedHasNext = false;

tokenInput.value = sessionStorage.getItem("adminToken") || "";
setMeta('meta[property="og:url"]', currentCanonicalUrl());
setMeta('meta[property="og:image"]', defaultShareImage());
setMeta('meta[property="og:locale"]', getOgLocale());
setMeta('meta[name="twitter:image"]', defaultShareImage());
setLink('link[rel="canonical"]', currentCanonicalUrl());

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

async function loadReviewed() {
  const token = tokenInput.value.trim();
  if (!token) {
    message.textContent = "Token admin wajib diisi.";
    return;
  }

  reviewedRows.innerHTML = `<tr><td colspan="6">Memuat artikel approved / rejected...</td></tr>`;

  try {
    const result = await getReviewedPosts(token, { page: reviewedPage, limit: REVIEWED_PAGE_SIZE });
    const posts = result.data;
    reviewedHasNext = posts.length === REVIEWED_PAGE_SIZE;
    reviewedPageLabel.textContent = `Halaman ${result.page}`;
    reviewedPrev.disabled = reviewedPage <= 1;
    reviewedNext.disabled = !reviewedHasNext;
    reviewedRows.innerHTML = posts.length
      ? posts.map(renderReviewedRow).join("")
      : `<tr><td colspan="6">Belum ada artikel approved atau rejected.</td></tr>`;
  } catch (error) {
    reviewedRows.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    reviewedPrev.disabled = reviewedPage <= 1;
    reviewedNext.disabled = true;
  }
}

async function loadAdminData() {
  const token = tokenInput.value.trim();
  if (!token) {
    message.textContent = "Token admin wajib diisi.";
    return;
  }

  sessionStorage.setItem("adminToken", token);
  await Promise.all([loadPending(), loadReviewed()]);
}

function renderPost(post) {
  const previewText = contentToPlainText(post.content || post.excerpt || "").slice(0, 280);
  return `
    <article class="admin-card" data-id="${post.id}">
      <h2>${escapeHtml(post.title)}</h2>
      <div class="admin-meta">${escapeHtml(post.category || "-")} - ${escapeHtml(post.location || "-")} - ${escapeHtml(post.author_name || "-")}</div>
      <p class="admin-excerpt">${escapeHtml(previewText)}</p>
      <div class="admin-actions">
        <button class="admin-btn" data-action="approve">Approve</button>
        <button class="admin-btn secondary" data-action="reject">Reject</button>
        <button class="admin-btn danger" data-action="delete">Delete</button>
      </div>
    </article>
  `;
}

function renderReviewedRow(post) {
  const date = formatDate(post.updated_at || post.approved_at || post.created_at);
  return `
    <tr data-id="${post.id}">
      <td>
        <strong>${escapeHtml(post.title)}</strong>
        ${post.rejection_reason ? `<div class="admin-meta">${escapeHtml(post.rejection_reason)}</div>` : ""}
      </td>
      <td><span class="status-badge ${escapeHtml(post.status)}">${escapeHtml(post.status)}</span></td>
      <td>${escapeHtml(post.category || "-")}</td>
      <td>${escapeHtml(post.author_name || "-")}</td>
      <td>${escapeHtml(date)}</td>
      <td><button class="admin-btn danger" data-action="delete-reviewed">Delete</button></td>
    </tr>
  `;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  reviewedPage = 1;
  loadAdminData();
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
      reviewedPage = 1;
    } else if (action === "reject") {
      const reason = prompt("Alasan reject:");
      if (!reason) {
        button.disabled = false;
        return;
      }
      await rejectPost(token, id, reason);
      reviewedPage = 1;
    } else if (action === "delete") {
      await deletePost(token, id);
    }
    await loadAdminData();
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
  }
});

reviewedRows.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action='delete-reviewed']");
  const row = event.target.closest("[data-id]");
  if (!button || !row) {
    return;
  }

  const token = tokenInput.value.trim();
  if (!token) {
    message.textContent = "Token admin wajib diisi.";
    return;
  }

  button.disabled = true;
  try {
    await deletePost(token, row.dataset.id);
    await loadReviewed();
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
  }
});

reviewedPrev.addEventListener("click", () => {
  if (reviewedPage <= 1) {
    return;
  }

  reviewedPage -= 1;
  loadReviewed();
});

reviewedNext.addEventListener("click", () => {
  if (!reviewedHasNext) {
    return;
  }

  reviewedPage += 1;
  loadReviewed();
});
