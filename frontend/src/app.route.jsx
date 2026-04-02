import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Protected from "./features/auth/components/Protected";
import FluxLoader from "./components/FluxLoader";

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
          <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
            <FluxLoader
              title="Loading"
              subtitle="Spinning up the marketplace"
              compact
            />
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
          <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
            <FluxLoader
              title="Loading"
              subtitle="Gathering products and deals"
              compact
            />
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
          <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
            <FluxLoader
              title="Loading"
              subtitle="Preparing shark leaderboard"
              compact
            />
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
          <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
            <FluxLoader
              title="Loading"
              subtitle="Setting up registration"
              compact
            />
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
          <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
            <FluxLoader
              title="Loading"
              subtitle="Opening secure login"
              compact
            />
          </div>
        }
      >
        <Login />
      </Suspense>
    ),
  },
]);
