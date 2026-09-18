import { createRouter, createWebHistory } from "vue-router";
import { setLang } from "./shared/i18n/index";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("./features/posts/list/HomeView.vue") },
    { path: "/about", name: "about", component: () => import("./shared/views/AboutView.vue") },
    { path: "/guide", name: "guide", component: () => import("./shared/views/GuideView.vue") },
    { path: "/posts/:slug", name: "article", component: () => import("./features/posts/detail/ArticleView.vue") },
    { path: "/submit", name: "submit", component: () => import("./features/posts/submit/SubmitView.vue") },
    { path: "/admin", name: "admin", component: () => import("./features/admin/AdminView.vue") },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  setLang(to.query.lang);
});

export default router;
