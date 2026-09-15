import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UploadConfirmModal from "../UploadConfirmModal";

/**
 * pdf.js needs a real canvas, so the renderer is stubbed here: these tests are
 * about the dialog's selection/removal behaviour, not about rasterising.
 */
vi.mock("@/lib/pdfThumbnail", () => ({
  renderPdfFirstPage: vi.fn(async () => "data:image/png;base64,cGRm"),
}));

const makeFile = (name: string, size: number, type = "application/pdf") => {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

let onConfirm: ReturnType<typeof vi.fn>;
let onClose: ReturnType<typeof vi.fn>;
let revokedUrls: Set<string>;

beforeEach(() => {
  onConfirm = vi.fn();
  onClose = vi.fn();
  revokedUrls = new Set();
  // jsdom implements neither object URLs nor canvas encoding. Handing out a
  // distinct URL per call is what lets a test catch one being revoked while
  // still on screen.
  let issued = 0;
  URL.createObjectURL = vi.fn(() => `blob:preview-${++issued}`);
  URL.revokeObjectURL = vi.fn((url: string) => {
    revokedUrls.add(url);
  });
});

const renderModal = (files: File[]) =>
  render(
    <UploadConfirmModal files={files} onConfirm={onConfirm} onClose={onClose} />,
  );

describe("UploadConfirmModal", () => {
  it("summarises the staged files and previews the first one", () => {
    renderModal([makeFile("notes.pdf", 2048), makeFile("slides.pdf", 1024)]);

    expect(screen.getByText("1 / 2 files")).toBeInTheDocument();
    expect(screen.getByText("Total files").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Total size").nextElementSibling).toHaveTextContent("3.0 KB");
  });

  it("switches the preview pane to the file you pick", async () => {
    const user = userEvent.setup();
    renderModal([makeFile("notes.pdf", 2048), makeFile("slides.pdf", 1024)]);

    await user.click(screen.getByRole("button", { name: "Preview slides.pdf" }));

    expect(screen.getByText("2 / 2 files")).toBeInTheDocument();
  });

  it("drops a removed file without closing while others remain", async () => {
    const user = userEvent.setup();
    const keep = makeFile("notes.pdf", 2048);
    renderModal([keep, makeFile("slides.pdf", 1024)]);

    await user.click(screen.getByRole("button", { name: "Remove slides.pdf" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("1 / 1 files")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start upload/i }));
    expect(onConfirm).toHaveBeenCalledWith([keep]);
  });

  it("keeps the preview on a neighbour when the selected file is removed", async () => {
    const user = userEvent.setup();
    const files = [makeFile("a.pdf", 100), makeFile("b.pdf", 100), makeFile("c.pdf", 100)];
    renderModal(files);

    await user.click(screen.getByRole("button", { name: "Preview b.pdf" }));
    await user.click(screen.getByRole("button", { name: "Remove b.pdf" }));

    // c.pdf slid into b's slot, so the pane should now be showing it.
    expect(screen.getByText("2 / 2 files")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview c.pdf" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("previews an image with a live object URL under StrictMode", async () => {
    const photo = makeFile("holiday.jpg", 4096, "image/jpeg");
    render(
      <StrictMode>
        <UploadConfirmModal
          files={[photo]}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </StrictMode>,
    );

    const image = await screen.findByAltText("holiday.jpg");
    const src = image.getAttribute("src")!;
    expect(src).toMatch(/^blob:/);
    // StrictMode invokes every effect twice; the URL on screen must be one
    // that survived the intervening cleanup. The first assertion keeps the
    // second honest — without a cleanup having run, this proves nothing.
    expect(revokedUrls.size).toBeGreaterThan(0);
    expect(revokedUrls.has(src)).toBe(false);
  });

  it("renders a rasterised page for a PDF", async () => {
    renderModal([makeFile("notes.pdf", 2048)]);

    const page = await screen.findByAltText("First page of notes.pdf");
    expect(page).toHaveAttribute("src", "data:image/png;base64,cGRm");
  });

  it("closes instead of showing an empty dialog when the last file is removed", async () => {
    const user = userEvent.setup();
    renderModal([makeFile("notes.pdf", 2048)]);

    await user.click(screen.getByRole("button", { name: "Remove notes.pdf" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
