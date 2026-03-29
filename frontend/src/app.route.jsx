import { createBrowserRouter } from "react-router-dom";
import Home from "./features/Home/pages/Home";
import ProductPage from "./features/products/pages/product";
import Leaderboard from "./features/leaderboard/components/SharkCard";
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/Login";
import Protected from "./features/auth/components/Protected";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {
    path: "/products",
    element: (
      <Protected>
        <ProductPage />
      </Protected>
    ),
  },
  {
    path: "/leaderboard",
    element: (
      <Protected>
        <Leaderboard />
      </Protected>
    ),
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);
