import { createBrowserRouter } from "react-router-dom";
import Home from "./features/Home/pages/Home";
import ProductPage from "./features/products/pages/product";
import Leaderboard from "./features/leaderboard/components/SharkCard";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {
    path: "/products",
    element: <ProductPage />,
  },
  {
    path: "/leaderboard",
    element: <Leaderboard />,
  },
]);
