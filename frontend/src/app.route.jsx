import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Protected from "./features/auth/components/Protected";

const Home = lazy(() => import("./features/Home/pages/Home"));
const ProductPage = lazy(() => import("./features/products/pages/product"));
const Leaderboard = lazy(
  () => import("./features/leaderboard/components/SharkCard"),
);
const Register = lazy(() => import("./features/auth/pages/Register"));
const Login = lazy(() => import("./features/auth/pages/Login"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)] text-slate-200 text-sm font-semibold uppercase tracking-[0.3em]">
            Loading experience...
          </div>
        }
      >
        <Home />
      </Suspense>
    ),
  },
  {
    path: "/products",
    element: (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)] text-slate-200 text-sm font-semibold uppercase tracking-[0.3em]">
            Loading experience...
          </div>
        }
      >
        <Protected>
          <ProductPage />
        </Protected>
      </Suspense>
    ),
  },
  {
    path: "/leaderboard",
    element: (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)] text-slate-200 text-sm font-semibold uppercase tracking-[0.3em]">
            Loading experience...
          </div>
        }
      >
        <Protected>
          <Leaderboard />
        </Protected>
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)] text-slate-200 text-sm font-semibold uppercase tracking-[0.3em]">
            Loading experience...
          </div>
        }
      >
        <Register />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)] text-slate-200 text-sm font-semibold uppercase tracking-[0.3em]">
            Loading experience...
          </div>
        }
      >
        <Login />
      </Suspense>
    ),
  },
]);
