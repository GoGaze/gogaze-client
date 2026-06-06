import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider, useToast } from "./toast";

function Trigger() {
  const { toast } = useToast();
  return (
    <button onClick={() => toast({ title: "Saved", description: "All good", variant: "success" })}>
      fire
    </button>
  );
}

describe("ToastProvider / useToast", () => {
  it("renders a toast when triggered and dismisses it", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("fire"));
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss"));
    await waitFor(() => expect(screen.queryByText("Saved")).not.toBeInTheDocument());
  });

  it("throws if used outside the provider", () => {
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow();
  });
});
