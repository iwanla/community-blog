import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import ArticleView from "./views/ArticleView.vue";
import SubmitView from "./views/SubmitView.vue";
import AdminView from "./views/AdminView.vue";
import { setLang } from "./i18n/index";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/posts/:slug", name: "article", component: ArticleView },
    { path: "/submit", name: "submit", component: SubmitView },
    { path: "/admin", name: "admin", component: AdminView },
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
