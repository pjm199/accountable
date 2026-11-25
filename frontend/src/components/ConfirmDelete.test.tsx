import { render, screen } from "@testing-library/react";
import { ConfirmDeleteView, deleteMessage } from "./ConfirmDelete";

test("the organization message says its contacts and deals are kept", () => {
  expect(deleteMessage("organizations", { contacts: 4, deals: 3 })).toBe("Its 4 contacts and 3 deals will be kept, with no organization.");
  expect(deleteMessage("organizations", { contacts: 1, deals: 0 })).toBe("Its 1 contact will be kept, with no organization.");
});

test("the contact message counts deals kept and activities deleted", () => {
  expect(deleteMessage("contacts", { deals: 2, activities: 5 })).toBe(
    "Its 2 deals will be kept, with no main contact. Its 5 activities will be deleted.",
  );
  expect(deleteMessage("contacts", { deals: 0, activities: 1 })).toBe("Its 1 activity will be deleted.");
});

test("the deal message counts its activities and mentions the stage history", () => {
  expect(deleteMessage("deals", { activities: 3, stage_changes: 4 })).toBe("Its 3 activities and its stage history will be deleted.");
  expect(deleteMessage("deals", { activities: 0, stage_changes: 1 })).toBe("Its stage history will be deleted.");
});

test("the dialog names the record and shows the counts", () => {
  render(
    <ConfirmDeleteView kind="contacts" name="Hana Kim" counts={{ deals: 2, activities: 5 }} busy={false} error={null} onConfirm={() => {}} onCancel={() => {}} />,
  );
  expect(screen.getByRole("dialog", { name: "Delete contact?" })).toBeInTheDocument();
  expect(screen.getByText("Hana Kim")).toBeInTheDocument();
  expect(screen.getByText(/Its 2 deals will be kept, with no main contact. Its 5 activities will be deleted./)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Delete contact" })).toBeEnabled();
});

test("delete waits for the counts", () => {
  render(<ConfirmDeleteView kind="deals" name="X" counts={undefined} busy={false} error={null} onConfirm={() => {}} onCancel={() => {}} />);
  expect(screen.getByRole("button", { name: "Delete deal" })).toBeDisabled();
});
