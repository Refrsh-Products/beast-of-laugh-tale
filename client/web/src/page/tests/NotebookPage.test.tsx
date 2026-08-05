import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import NotebookPage from "../NotebookPage";
import useAuthService from "../../services/auth";
import useNotebookService from "../../services/notebooks";
import useChatService from "../../services/chat";
import useQuizService from "../../services/quiz";
import usePresentationService from "../../services/presentation";
import useAccountService from "../../services/account";
import useTranscriptionService from "../../services/transcription";
import { getAccount as getCachedAccount } from "../../storage";

vi.mock("../../services/auth");
vi.mock("../../services/notebooks");
vi.mock("../../services/chat");
vi.mock("../../services/quiz");
vi.mock("../../services/presentation");
vi.mock("../../services/account");
vi.mock("../../services/transcription");
vi.mock("../../storage");

/**
 * The main-area tools are stubbed so these tests are about the workspace
 * shell: which tool is mounted, what the sidebar shows beside it, and — the
 * regression this restructure most risks — that the materials list survives
 * every tool switch.
 */
vi.mock("../../components/notebook/ChatColumn", () => ({
  default: () => <div data-testid="chat-column" />,
}));
vi.mock("../../components/notebook/QuizColumn", () => ({
  default: () => <div data-testid="quiz-column" />,
}));
vi.mock("../../components/notebook/QuizReviewColumn", () => ({
  default: () => <div data-testid="quiz-review-column" />,
}));
vi.mock("../../components/notebook/PresentationColumn", () => ({
  default: () => <div data-testid="presentation-column" />,
}));
vi.mock("../../components/notebook/AudioColumn", () => ({
  default: () => <div data-testid="audio-column" />,
}));
vi.mock("../../components/notebook/QuizTakingScreen", () => ({
  default: () => null,
}));
vi.mock("../../components/presentation/PresentationViewer", () => ({
  default: () => null,
}));
vi.mock("../../components/dashboard/UpgradeModal", () => ({
  default: () => null,
}));

const ACCOUNT = {
  id: "acc-1",
  first_name: "Amara",
  last_name: "Okafor",
  profile_picture_url: "",
};

function renderNotebook(path = "/notebook/test-id") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/notebook/:id" element={<NotebookPage />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
        <Route
          path="/dashboard"
          element={<div data-testid="dashboard-page" />}
        />
        <Route path="/profile" element={<div data-testid="profile-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(getCachedAccount).mockReturnValue(ACCOUNT as any);

  vi.mocked(useAuthService).mockReturnValue({
    isLoggedIn: () => true,
    getUser: () => ({ email: "amara@example.com" }),
  } as any);

  vi.mocked(useNotebookService).mockReturnValue({
    getNotebook: () =>
      Promise.resolve({
        id: "test-id",
        title: "Test Notebook",
        is_archived: false,
      }),
    listFiles: () =>
      Promise.resolve([
        {
          id: "f1",
          notebook: "test-id",
          name: "lecture-1.pdf",
          file_type: "pdf",
          ingestion_status: "ready",
          uploaded_at: "2026-07-01T10:00:00Z",
          updated_at: "2026-07-01T10:00:00Z",
        },
      ]),
    listTopics: () => Promise.resolve([]),
    update: vi.fn(() => Promise.resolve({})),
    archive: vi.fn(() => Promise.resolve({})),
    unarchive: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  } as any);

  vi.mocked(useChatService).mockReturnValue({
    listChatSessions: () => Promise.resolve([]),
    getChatSessionMessages: () => Promise.resolve([]),
  } as any);

  vi.mocked(useQuizService).mockReturnValue({
    listQuizSessionsByNotebook: () =>
      Promise.resolve([
        {
          id: "q1",
          title: "Cell Biology",
          // The API sends a 0–1 fraction, not a percentage.
          score: 0.867,
          completed_at: "2026-07-30T10:00:00Z",
        },
      ]),
  } as any);

  vi.mocked(usePresentationService).mockReturnValue({
    listPresentationsByNotebook: () => Promise.resolve([]),
  } as any);

  vi.mocked(useAccountService).mockReturnValue({
    getAccountUsage: () =>
      Promise.resolve({ features: { audio_notes: true } }),
  } as any);

  vi.mocked(useTranscriptionService).mockReturnValue({
    listAudioTranscripts: () => Promise.resolve([]),
    deleteAudioTranscript: vi.fn(() => Promise.resolve({})),
  } as any);
});

describe("NotebookPage shell", () => {
  it("renders the notebook title once loaded", async () => {
    renderNotebook();
    expect(
      await screen.findByRole("button", { name: /Test Notebook/ }),
    ).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    vi.mocked(useAuthService).mockReturnValue({
      isLoggedIn: () => false,
      getUser: () => null,
    } as any);
    renderNotebook();
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("opens the profile page from the avatar", async () => {
    renderNotebook();
    await screen.findByTestId("chat-column");
    await userEvent.click(
      screen.getByRole("button", { name: /profile and account/i }),
    );
    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
  });
});

describe("NotebookPage tool rail", () => {
  it("shows chat by default", async () => {
    renderNotebook();
    expect(await screen.findByTestId("chat-column")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-column")).not.toBeInTheDocument();
  });

  it.each([
    ["Quiz", "quiz-column"],
    ["Slides", "presentation-column"],
    ["Audio", "audio-column"],
  ])("switches the main panel to %s", async (label, testId) => {
    renderNotebook();
    await screen.findByTestId("chat-column");

    await userEvent.click(screen.getByRole("button", { name: label }));

    expect(await screen.findByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByTestId("chat-column")).not.toBeInTheDocument();
  });

  it("honours a ?view= deep link", async () => {
    renderNotebook("/notebook/test-id?view=quiz");
    expect(await screen.findByTestId("quiz-column")).toBeInTheDocument();
  });
});

describe("NotebookPage sidebar", () => {
  it("keeps the materials list mounted on every tool", async () => {
    // The whole point of the restructure: files used to vanish whenever the
    // right column was given over to quizzes or presentations.
    renderNotebook();
    await screen.findByTestId("chat-column");
    expect(screen.getByText("lecture-1.pdf")).toBeInTheDocument();

    for (const label of ["Quiz", "Slides", "Audio", "Chat"]) {
      await userEvent.click(screen.getByRole("button", { name: label }));
      expect(
        screen.getByText("lecture-1.pdf"),
        `materials missing on ${label}`,
      ).toBeInTheDocument();
    }
  });

  it("swaps the contextual panel with the active tool", async () => {
    renderNotebook();
    await screen.findByTestId("chat-column");
    expect(screen.getByRole("heading", { name: /chats/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Quiz" }));
    expect(
      await screen.findByRole("heading", { name: /past quizzes/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /chats/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Slides" }));
    expect(
      await screen.findByRole("heading", { name: /generated slides/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    expect(
      await screen.findByRole("heading", { name: /transcripts/i }),
    ).toBeInTheDocument();
  });

  it("renders a quiz score as a percentage, not a raw fraction", async () => {
    // score arrives as 0.867; rendering it verbatim produced "0.867%".
    renderNotebook("/notebook/test-id?view=quiz");
    expect(await screen.findByText("87%")).toBeInTheDocument();
    expect(screen.queryByText("0.867%")).not.toBeInTheDocument();
  });
});

describe("NotebookPage settings menu", () => {
  it("archives the notebook", async () => {
    renderNotebook();
    await screen.findByTestId("chat-column");

    await userEvent.click(
      screen.getByRole("button", { name: /notebook settings/i }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /^archive$/i }),
    );

    const service = vi.mocked(useNotebookService).mock.results.at(-1)!.value;
    expect(service.archive).toHaveBeenCalledWith("test-id");
  });

  it("confirms before deleting the notebook", async () => {
    renderNotebook();
    await screen.findByTestId("chat-column");

    await userEvent.click(
      screen.getByRole("button", { name: /notebook settings/i }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /delete notebook/i }),
    );

    expect(
      await screen.findByRole("dialog", { name: /delete/i }),
    ).toBeInTheDocument();
  });
});
