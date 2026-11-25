import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type Column } from "./DataTable";

interface Row {
  id: number;
  name: string;
  city: string | null;
  value: number | null;
  date: string | null;
}

const rows: Row[] = [
  { id: 1, name: "Brightwave Media", city: "Austin", value: 900, date: "2026-12-01" },
  { id: 2, name: "harbor Dental", city: null, value: 50, date: null },
  { id: 3, name: "Alder & Finch", city: "Boston", value: null, date: "2026-01-15" },
];

const columns: Column<Row>[] = [
  { id: "name", header: "Name", kind: "text", value: (r) => r.name },
  { id: "city", header: "City", kind: "text", value: (r) => r.city },
  { id: "value", header: "Value", kind: "number", value: (r) => r.value },
  { id: "date", header: "Date", kind: "date", value: (r) => r.date },
];

function setup(data = rows) {
  render(<DataTable label="Things" columns={columns} data={data} rowId={(r) => r.id} empty={<p>No things yet.</p>} />);
  return userEvent.setup();
}

const names = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

test("search ignores case and looks across text columns", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "HARBOR");
  expect(names()).toEqual(["harbor Dental"]);
  await user.clear(screen.getByRole("searchbox"));
  await user.type(screen.getByRole("searchbox"), "bost");
  expect(names()).toEqual(["Alder & Finch"]);
});

test("search doesn't match number columns", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "900");
  expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
});

test("clicking a heading sorts, and again reverses", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: /Name/ }));
  expect(names()).toEqual(["Alder & Finch", "Brightwave Media", "harbor Dental"]);
  await user.click(screen.getByRole("button", { name: /Name/ }));
  expect(names()).toEqual(["harbor Dental", "Brightwave Media", "Alder & Finch"]);
});

test("numbers and dates sort as numbers and dates, with empty cells last both ways", async () => {
  const user = setup();
  const value = screen.getByRole("button", { name: /Value/ });
  await user.click(value);
  const first = names();
  await user.click(value);
  const second = names();
  // Value sorts ascending or descending first depending on the library's
  // default for numbers; either way the empty one stays last.
  expect([first, second]).toContainEqual(["harbor Dental", "Brightwave Media", "Alder & Finch"]);
  expect([first, second]).toContainEqual(["Brightwave Media", "harbor Dental", "Alder & Finch"]);

  const date = screen.getByRole("button", { name: /Date/ });
  await user.click(date);
  const d1 = names();
  await user.click(date);
  const d2 = names();
  expect([d1, d2]).toContainEqual(["Alder & Finch", "Brightwave Media", "harbor Dental"]);
  expect([d1, d2]).toContainEqual(["Brightwave Media", "Alder & Finch", "harbor Dental"]);
});

test("empty cells show a dash", () => {
  setup();
  const harbor = screen.getByText("harbor Dental").closest("tr")!;
  expect(within(harbor).getAllByText("—")).toHaveLength(2);
});

test("the empty state shows when there are no rows", () => {
  setup([]);
  expect(screen.getByText("No things yet.")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
