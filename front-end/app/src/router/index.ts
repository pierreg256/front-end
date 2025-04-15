import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { getCurrentUser } from "../services/api";

// Définition des routes
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/HomeView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/AboutView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/auth",
    name: "Auth",
    component: () => import("../views/AuthView.vue"),
    meta: { guest: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Garde de navigation pour protéger les routes authentifiées
router.beforeEach((to, from, next) => {
  const currentUser = getCurrentUser();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isGuestRoute = to.matched.some((record) => record.meta.guest);

  if (requiresAuth && !currentUser) {
    // Rediriger vers la page de connexion si non authentifié
    next({ name: "Auth" });
  } else if (isGuestRoute && currentUser) {
    // Rediriger vers la page d'accueil si déjà authentifié
    next({ name: "Home" });
  } else {
    next();
  }
});

export default router;
