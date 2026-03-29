import { RouterProvider } from "react-router-dom";
import { router } from "./app.route";
import { NegotiationProvider } from "./features/negotiation/negotiation.context";
import { AuthProvider } from "./features/auth/auth.context";

const App = () => {
  return (
    <>
      <AuthProvider>
        <NegotiationProvider>
          <RouterProvider router={router} />
        </NegotiationProvider>
      </AuthProvider>
    </>
  );
};
export default App;
