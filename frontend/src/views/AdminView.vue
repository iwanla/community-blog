<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { approvePost, deletePost, getPendingPosts, getReviewedPosts, rejectPost } from "../services/api";
import { contentToPlainText } from "../utils/content";
import { currentCanonicalUrl, defaultShareImage } from "../i18n/index";
import { resetArticleMeta, setBaseMeta, setRobots } from "../utils/meta";
import type { Post } from "../types";

const REVIEWED_PAGE_SIZE = 10;

const token = ref(sessionStorage.getItem("adminToken") || "");
const message = ref("Masukkan token admin untuk memuat data moderasi.");
const pendingPosts = ref<Post[]>([]);
const reviewedPosts = ref<Post[]>([]);
const reviewedPage = ref(1);
const reviewedHasNext = ref(false);
const loading = ref(false);

const pageLabel = computed(() => `Halaman ${reviewedPage.value}`);

function renderMeta() {
  setRobots("noindex, nofollow");
  resetArticleMeta();
  setBaseMeta({
    title: "Admin - JelajahTaliabu",
    description: "Dashboard moderasi artikel JelajahTaliabu.",
    url: currentCanonicalUrl(),
    image: defaultShareImage(),
    type: "website",
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Permintaan gagal diproses.";
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

async function loadPending() {
  pendingPosts.value = await getPendingPosts(token.value.trim());
  message.value = pendingPosts.value.length ? `${pendingPosts.value.length} artikel menunggu review.` : "Tidak ada artikel pending.";
}

async function loadReviewed() {
  const result = await getReviewedPosts(token.value.trim(), { page: reviewedPage.value, limit: REVIEWED_PAGE_SIZE });
  reviewedPosts.value = result.data;
  reviewedHasNext.value = result.data.length === REVIEWED_PAGE_SIZE;
  reviewedPage.value = result.page;
}

async function loadAdminData() {
  if (!token.value.trim()) {
    message.value = "Token admin wajib diisi.";
    return;
  }
  sessionStorage.setItem("adminToken", token.value.trim());
  loading.value = true;
  message.value = "Memuat data moderasi...";
  try {
    await Promise.all([loadPending(), loadReviewed()]);
  } catch (error) {
    message.value = errorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function moderate(action: "approve" | "reject" | "delete", postId: Post["id"]) {
  const adminToken = token.value.trim();
  if (!adminToken) {
    message.value = "Token admin wajib diisi.";
    return;
  }

  try {
    if (action === "approve") {
      await approvePost(adminToken, postId);
      reviewedPage.value = 1;
    } else if (action === "reject") {
      const reason = prompt("Alasan reject:");
      if (!reason) {
        return;
      }
      await rejectPost(adminToken, postId, reason);
      reviewedPage.value = 1;
    } else if (action === "delete") {
      await deletePost(adminToken, postId);
    }
    await loadAdminData();
  } catch (error) {
    message.value = errorMessage(error);
  }
}

async function deleteReviewed(postId: Post["id"]) {
  try {
    await deletePost(token.value.trim(), postId);
    await loadReviewed();
  } catch (error) {
    message.value = errorMessage(error);
  }
}

async function previousPage() {
  if (reviewedPage.value <= 1) {
    return;
  }
  reviewedPage.value -= 1;
  await loadReviewed();
}

async function nextPage() {
  if (!reviewedHasNext.value) {
    return;
  }
  reviewedPage.value += 1;
  await loadReviewed();
}

onMounted(renderMeta);
</script>

<template>
  <main class="admin-shell">
    <div class="admin-head">
      <h1>Moderasi Artikel</h1>
      <RouterLink to="/">Kembali ke Beranda</RouterLink>
    </div>

    <form class="token-form" @submit.prevent="reviewedPage = 1; loadAdminData()">
      <input v-model="token" type="password" placeholder="ADMIN_TOKEN" autocomplete="current-password" />
      <button class="admin-btn" type="submit" :disabled="loading">Muat Data</button>
    </form>

    <div class="admin-empty">{{ message }}</div>

    <section class="admin-section">
      <div class="admin-section-head">
        <h2>Submission Pending</h2>
      </div>
      <section class="admin-list">
        <article v-for="post in pendingPosts" :key="post.id" class="admin-card">
          <h2>{{ post.title }}</h2>
          <div class="admin-meta">{{ post.category || "-" }} - {{ post.location || "-" }} - {{ post.author_name || "-" }}</div>
          <p class="admin-excerpt">{{ contentToPlainText(post.content || post.excerpt || "").slice(0, 280) }}</p>
          <div class="admin-actions">
            <button class="admin-btn" type="button" @click="moderate('approve', post.id)">Approve</button>
            <button class="admin-btn secondary" type="button" @click="moderate('reject', post.id)">Reject</button>
            <button class="admin-btn danger" type="button" @click="moderate('delete', post.id)">Delete</button>
          </div>
        </article>
      </section>
    </section>

    <section class="admin-section" aria-labelledby="reviewed-title">
      <div class="admin-section-head">
        <h2 id="reviewed-title">Artikel Approved / Rejected</h2>
      </div>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Status</th>
              <th>Kategori</th>
              <th>Penulis</th>
              <th>Tanggal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="reviewedPosts.length === 0">
              <td colspan="6">Masukkan token admin untuk memuat data.</td>
            </tr>
            <tr v-for="post in reviewedPosts" v-else :key="post.id">
              <td>
                <strong>{{ post.title }}</strong>
                <div v-if="post.rejection_reason" class="admin-meta">{{ post.rejection_reason }}</div>
              </td>
              <td><span class="status-badge" :class="post.status">{{ post.status }}</span></td>
              <td>{{ post.category || "-" }}</td>
              <td>{{ post.author_name || "-" }}</td>
              <td>{{ formatDate(post.updated_at || post.approved_at || post.created_at) }}</td>
              <td><button class="admin-btn danger" type="button" @click="deleteReviewed(post.id)">Delete</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="reviewed-pagination">
        <button class="admin-btn secondary" type="button" :disabled="reviewedPage <= 1" @click="previousPage">Sebelumnya</button>
        <span class="reviewed-page">{{ pageLabel }}</span>
        <button class="admin-btn secondary" type="button" :disabled="!reviewedHasNext" @click="nextPage">Berikutnya</button>
      </div>
    </section>
  </main>
</template>

<style>
.admin-shell { max-width: 1040px; margin: 0 auto; padding: 32px 20px 56px; }
.admin-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 24px; }
.admin-head h1 { font-size: 24px; margin: 0; }
.token-form { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.token-form input { min-width: 260px; flex: 1; padding: 10px 12px; border: 1px solid rgba(4,44,83,.14); border-radius: 8px; }
.admin-btn { border: 0; border-radius: 8px; padding: 10px 14px; background: #185fa5; color: white; cursor: pointer; }
.admin-btn:disabled { cursor: not-allowed; opacity: .6; }
.admin-btn.secondary { background: #5f5e5a; }
.admin-btn.danger { background: #a32d2d; }
.admin-section { margin-top: 28px; }
.admin-section-head { align-items: center; display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.admin-section-head h2 { font-size: 19px; margin: 0; }
.admin-list { display: grid; gap: 12px; }
.admin-card { background: white; border: 1px solid rgba(4,44,83,.1); border-radius: 8px; padding: 16px; }
.admin-card h2 { font-size: 18px; margin: 0 0 8px; }
.admin-meta { color: #5f5e5a; font-size: 13px; margin-bottom: 10px; }
.admin-excerpt { color: #333; line-height: 1.6; margin-bottom: 14px; }
.admin-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.admin-empty { padding: 24px; background: white; border-radius: 8px; color: #5f5e5a; }
.table-wrap { background: white; border: 1px solid rgba(4,44,83,.1); border-radius: 8px; overflow-x: auto; }
.admin-table { border-collapse: collapse; min-width: 760px; width: 100%; }
.admin-table th, .admin-table td { border-bottom: 1px solid rgba(4,44,83,.08); padding: 12px; text-align: left; vertical-align: top; }
.admin-table th { color: #5f5e5a; font-size: 12px; letter-spacing: 0; text-transform: uppercase; }
.admin-table tr:last-child td { border-bottom: 0; }
.status-badge { border-radius: 999px; color: white; display: inline-flex; font-size: 12px; line-height: 1; padding: 6px 8px; text-transform: capitalize; }
.status-badge.approved { background: #1f7a4d; }
.status-badge.rejected { background: #9a4b17; }
.reviewed-pagination { align-items: center; display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px; }
.reviewed-page { color: #5f5e5a; font-size: 14px; }
</style>
