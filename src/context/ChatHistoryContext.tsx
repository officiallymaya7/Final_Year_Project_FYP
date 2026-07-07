import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  contentType?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatHistoryContextType {
  sessions: ChatSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  loading: boolean;
  createNewSession: () => Promise<void>;
  addMessage: (sessionId: string, role: "user" | "ai", content: string, contentType?: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export const ChatHistoryProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [loading, setLoading] = useState(true);

  // Load all sessions + their messages on mount
  const loadSessions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: sessionRows } = await supabase
      .from("chat_sessions")
      .select("id, title")
      .order("created_at", { ascending: false });

    if (!sessionRows || sessionRows.length === 0) {
      // Create a first empty session if none exist
      await createNewSession();
      setLoading(false);
      return;
    }

    const sessionsWithMessages: ChatSession[] = [];
    for (const s of sessionRows) {
      const { data: messageRows } = await supabase
        .from("chat_messages")
        .select("id, role, content, content_type")
        .eq("session_id", s.id)
        .order("created_at", { ascending: true });

      sessionsWithMessages.push({
        id: s.id,
        title: s.title,
        messages: (messageRows || []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "ai",
          content: m.content,
          contentType: m.content_type || undefined,
        })),
      });
    }

    setSessions(sessionsWithMessages);
    setActiveSessionId(sessionsWithMessages[0].id);
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createNewSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();

    if (error || !data) return;

    const newSession: ChatSession = { id: data.id, title: data.title, messages: [] };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const addMessage = async (
    sessionId: string,
    role: "user" | "ai",
    content: string,
    contentType?: string
  ) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ session_id: sessionId, role, content, content_type: contentType })
      .select()
      .single();

    if (error || !data) return;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [
                ...s.messages,
                { id: data.id, role, content, contentType },
              ],
            }
          : s
      )
    );
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    await supabase.from("chat_sessions").update({ title }).eq("id", sessionId);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
    );
  };

  return (
    <ChatHistoryContext.Provider
      value={{
        sessions,
        activeSessionId,
        setActiveSessionId,
        loading,
        createNewSession,
        addMessage,
        updateSessionTitle,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error("useChatHistory must be used within ChatHistoryProvider");
  }
  return context;
};