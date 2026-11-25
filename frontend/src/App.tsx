import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { DealFormProvider } from "./components/DealFormContext";
import { ToastProvider } from "./components/Toast";
import { AppRoutes } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 5_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <DealFormProvider>
            <AppRoutes />
          </DealFormProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
