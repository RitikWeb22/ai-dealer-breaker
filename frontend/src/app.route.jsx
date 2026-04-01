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
          <div className="min-h-screen flex items-center justify-center bg-[#070707] text-zinc-200 text-sm tracking-wide">
            Loading...
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
          <div className="min-h-screen flex items-center justify-center bg-[#070707] text-zinc-200 text-sm tracking-wide">
            Loading...
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
          <div className="min-h-screen flex items-center justify-center bg-[#070707] text-zinc-200 text-sm tracking-wide">
            Loading...
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
          <div className="min-h-screen flex items-center justify-center bg-[#070707] text-zinc-200 text-sm tracking-wide">
            Loading...
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
          <div className="min-h-screen flex items-center justify-center bg-[#070707] text-zinc-200 text-sm tracking-wide">
            Loading...
          </div>
        }
      >
        <Login />
      </Suspense>
    ),
  },
]);
