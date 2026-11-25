import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./routes";

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

test("an unknown address shows Page not found with a link home", () => {
  renderAt("/nowhere");
  expect(screen.getByText("Page not found")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go to the dashboard" })).toHaveAttribute("href", "/");
});
