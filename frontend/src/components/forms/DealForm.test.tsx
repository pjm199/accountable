import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DealForm, dealValues } from "./DealForm";

const today = () => new Date(2026, 10, 24, 10, 0);

function setup(initial = dealValues(undefined, { stage: "proposal" })) {
  const onSubmit = vi.fn();
  render(
    <DealForm initial={initial} organizations={[]} contacts={[]} onSubmit={onSubmit} onCancel={() => {}} submitLabel="Save" today={today} />,
  );
  return { onSubmit, user: userEvent.setup() };
}

const probability = () => screen.getByLabelText(/Probability/) as HTMLInputElement;
const closeDate = () => screen.getByLabelText("Close date") as HTMLInputElement;

test("a new deal starts with its stage's usual probability", () => {
  setup();
  expect(probability().value).toBe("50");
});

test("picking a stage fills in its probability", async () => {
  const { user } = setup();
  await user.selectOptions(screen.getByLabelText(/Stage/), "negotiation");
  expect(probability().value).toBe("75");
  expect(closeDate().value).toBe("");
});

test("picking Won or Lost fills in today's date", async () => {
  const { user } = setup();
  await user.selectOptions(screen.getByLabelText(/Stage/), "won");
  expect(probability().value).toBe("100");
  expect(closeDate().value).toBe("2026-11-24");
  await user.selectOptions(screen.getByLabelText(/Stage/), "lost");
  expect(probability().value).toBe("0");
});

test("both can be overwritten before saving, and the form sends what it shows", async () => {
  const { user, onSubmit } = setup();
  await user.type(screen.getByLabelText(/Name/), "Equipment lease");
  await user.type(screen.getByLabelText(/Value/), "58,000");
  await user.selectOptions(screen.getByLabelText(/Stage/), "won");
  await user.clear(probability());
  await user.type(probability(), "90");
  await user.clear(closeDate());
  await user.type(closeDate(), "2026-11-20");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSubmit).toHaveBeenCalledWith({
    name: "Equipment lease",
    stage: "won",
    value_cents: 5_800_000,
    probability: 90,
    close_date: "2026-11-20",
    organization_id: null,
    contact_id: null,
  });
});

test("required fields stop the save", async () => {
  const { user, onSubmit } = setup();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Name is required.")).toBeInTheDocument();
  expect(screen.getByText("Value is required.")).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});
