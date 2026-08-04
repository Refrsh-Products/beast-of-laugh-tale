import { useRef, useState } from "react";
import type { ChatSession } from "@freshr/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RiAddLine,
  RiMoreLine,
  RiPencilLine,
  RiDeleteBin6Line,
} from "@remixicon/react";
import { SidebarItem, SidebarSection, SidebarEmpty } from "./SidebarSection";

/**
 * The chat session list, lifted out of ChatColumn's inline dropdown so it can
 * live permanently in the sidebar alongside the notebook's materials.
 */
export default function ChatSessionsPanel({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  disabled = false,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (chatId: string, title: string) => Promise<void>;
  onDeleteSession: (chatId: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const cancelledRef = useRef(false);
  const interactedRef = useRef(false);
  const renamingRef = useRef(false);

  function startRename(session: ChatSession) {
    renamingRef.current = true;
    interactedRef.current = false;
    setEditingId(session.id);
    setDraftTitle(session.title);
  }

  async function commitRename(id: string) {
    const trimmed = draftTitle.trim();
    setEditingId(null);
    if (trimmed) await onRenameSession(id, trimmed);
  }

  return (
    <SidebarSection
      title="Chats"
      action={
        <Button
          size="sm"
          className="w-full"
          onClick={onNewSession}
          disabled={disabled}
        >
          <RiAddLine aria-hidden="true" />
          New chat
        </Button>
      }
    >
      {sessions.length === 0 ? (
        <SidebarEmpty>
          No new chat session click the button to create a new session and start
          chatting.
        </SidebarEmpty>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {sessions.map((session) => (
            <li key={session.id} className="group/session relative">
              {editingId === session.id ? (
                <Input
                  autoFocus
                  value={draftTitle}
                  aria-label="Chat title"
                  className="h-8"
                  onChange={(e) => {
                    interactedRef.current = true;
                    setDraftTitle(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    interactedRef.current = true;
                    if (e.key === "Enter") commitRename(session.id);
                    if (e.key === "Escape") {
                      cancelledRef.current = true;
                      setEditingId(null);
                    }
                  }}
                  onBlur={() => {
                    if (cancelledRef.current) {
                      cancelledRef.current = false;
                      return;
                    }
                    if (!interactedRef.current) return;
                    interactedRef.current = false;
                    commitRename(session.id);
                  }}
                />
              ) : (
                <SidebarItem
                  active={session.id === activeSessionId}
                  onClick={() => onSessionSelect(session.id)}
                  className="pr-8"
                >
                  <span className="truncate">{session.title}</span>
                </SidebarItem>
              )}

              {editingId !== session.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Actions for ${session.title}`}
                      className="absolute top-1/2 right-1 z-10 -translate-y-1/2 opacity-0 focus-visible:opacity-100 group-hover/session:opacity-100"
                    >
                      <RiMoreLine aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40"
                    onCloseAutoFocus={(event) => {
                      if (renamingRef.current) {
                        renamingRef.current = false;
                        event.preventDefault();
                      }
                    }}
                  >
                    <DropdownMenuItem
                      disabled={disabled}
                      onSelect={() => startRename(session)}
                    >
                      <RiPencilLine aria-hidden="true" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={disabled}
                      onSelect={() => onDeleteSession(session.id)}
                    >
                      <RiDeleteBin6Line aria-hidden="true" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      )}
    </SidebarSection>
  );
}
