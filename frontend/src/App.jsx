import { RouterProvider } from "react-router-dom";
import { router } from "./app.route";
import { NegotiationProvider } from "./features/negotiation/negotiation.context";

const App = () => {
  return (
    <>
      <NegotiationProvider>
        <RouterProvider router={router} />
      </NegotiationProvider>
    </>
  );
};
export default App;
