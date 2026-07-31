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

vi.mock("../../services/auth");
vi.mock("../../services/notebooks");
vi.mock("../../services/chat");
vi.mock("../../services/quiz");
vi.mock("../../services/presentation");

vi.mock("../../components/notebook/NotebookTitle", () => ({
  default: ({ title }: { title: string }) => (
    <span data-testid="notebook-title">{title}</span>
  ),
}));
vi.mock("../../components/notebook/ChatColumn", () => ({
  default: () => <div data-testid="chat-column" />,
}));
vi.mock("../../components/notebook/FilesColumn", () => ({
  default: () => <div data-testid="files-column" />,
}));
vi.mock("../../components/notebook/QuizColumn", () => ({
  default: () => <div data-testid="quiz-column" />,
}));
vi.mock("../../components/notebook/QuizReviewColumn", () => ({
  default: () => <div data-testid="quiz-review-column" />,
}));
vi.mock("../../components/notebook/PastQuizColumn", () => ({
  default: () => <div data-testid="past-quiz-column" />,
}));
vi.mock("../../components/notebook/PresentationColumn", () => ({
  default: () => <div data-testid="presentation-column" />,
}));
vi.mock("../../components/notebook/PastPresentationsColumn", () => ({
  default: () => <div data-testid="past-presentations-column" />,
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

function renderNotebook() {
  return render(
    <MemoryRouter initialEntries={["/notebook/test-id"]}>
      <Routes>
        <Route path="/notebook/:id" element={<NotebookPage />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(useAuthService).mockReturnValue({
    isLoggedIn: () => true,
  } as any);

  vi.mocked(useNotebookService).mockReturnValue({
    getNotebook: () => Promise.resolve({ id: "test-id", title: "Test Notebook" }),
    listFiles: () => Promise.resolve([]),
    listTopics: () => Promise.resolve([]),
  } as any);

  vi.mocked(useChatService).mockReturnValue({
    listChatSessions: () => Promise.resolve([]),
    getChatSessionMessages: () => Promise.resolve([]),
  } as any);

  vi.mocked(useQuizService).mockReturnValue({
    listQuizSessionsByNotebook: () => Promise.resolve([]),
  } as any);

  vi.mocked(usePresentationService).mockReturnValue({
    listPresentationsByNotebook: () => Promise.resolve([]),
  } as any);
});

describe("NotebookPage", () => {
  it("renders the notebook after loading", async () => {
    renderNotebook();
    expect(await screen.findByTestId("notebook-title")).toHaveTextContent(
      "Test Notebook",
    );
  });

  it("redirects to /login when not authenticated", () => {
    vi.mocked(useAuthService).mockReturnValue({
      isLoggedIn: () => false,
    } as any);
    renderNotebook();
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("chat view (default): renders ChatColumn in center, FilesColumn on right", async () => {
    renderNotebook();
    await screen.findByTestId("chat-column");
    expect(screen.getByTestId("files-column")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-column")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-column")).not.toBeInTheDocument();
  });

  it("quiz view: renders QuizColumn in center, PastQuizColumn on right", async () => {
    renderNotebook();
    await screen.findByTestId("chat-column");
    await userEvent.click(screen.getByText("Quiz Generator"));
    expect(await screen.findByTestId("quiz-column")).toBeInTheDocument();
    expect(screen.getByTestId("past-quiz-column")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-column")).not.toBeInTheDocument();
    expect(screen.queryByTestId("files-column")).not.toBeInTheDocument();
  });

  it("presentation view: renders PresentationColumn in center, PastPresentationsColumn on right", async () => {
    renderNotebook();
    await screen.findByTestId("chat-column");
    await userEvent.click(screen.getByText("Presentation"));
    expect(await screen.findByTestId("presentation-column")).toBeInTheDocument();
    expect(screen.getByTestId("past-presentations-column")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-column")).not.toBeInTheDocument();
    expect(screen.queryByTestId("files-column")).not.toBeInTheDocument();
  });
});
