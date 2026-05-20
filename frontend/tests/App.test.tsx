import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("App", () => {
  it("renders gym tracker login screen", () => {
    render(<App />);

    expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
  });
});
