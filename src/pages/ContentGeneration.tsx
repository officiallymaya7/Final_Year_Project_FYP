import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Plus, MessageSquare, Copy, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useChatHistory } from "@/context/ChatHistoryContext";
import DashboardHeader from "@/components/DashboardHeader";

const CONTENT_TYPES = [
  "Invitation Email",
  "Proposal Letter",
  "Congratulations Email",
  "Thank You Message",
  "Speaker Invitation",
  "Certificate Delivery Email",
  "Event Announcement",
];

const ContentGeneration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    loading: historyLoading,
    createNewSession,
    addMessage,
    updateSessionTitle,
  } = useChatHistory();

  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeSession?.messages]);

  const handleSend = async () => {
    if (!prompt.trim() || generating || !activeSessionId) return;

    const currentPrompt = prompt;
    setPrompt("");
    setGenerating(true);

    // Save user message to DB + local state
    await addMessage(activeSessionId, "user", currentPrompt, contentType);

    // If this was the first message, update session title
    if (activeSession && activeSession.messages.length === 0) {
      updateSessionTitle(activeSessionId, currentPrompt.slice(0, 30));
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { prompt: currentPrompt, contentType },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await addMessage(activeSessionId, "ai", data.content, contentType);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: err.message || "Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  };

  const handleUseInEmail = (content: string) => {
    navigate("/dashboard/email-automation", { state: { generatedContent: content } });
  };

  if (historyLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat History */}
        <aside className="w-64 border-r border-border bg-card/30 flex flex-col">
          <div className="p-3">
            <Button
              onClick={createNewSession}
              variant="outline"
              className="w-full justify-start gap-2 border-border/50"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors truncate ${
                  session.id === activeSessionId
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="fixed inset-0 pointer-events-none -z-10">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[120px]" />
          </div>

          {/* Content Type Selector */}
          <div className="border-b border-border px-6 py-3 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Content Type:</span>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="bg-card/60 border border-border/50 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
            {!activeSession || activeSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">AI Content Assistant</h2>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Describe what you need and I'll draft professional event content for you.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                <AnimatePresence initial={false}>
                  {activeSession.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card/60 backdrop-blur-xl border border-border/50"
                        }`}
                      >
                        {msg.role === "ai" && (
                          <span className="text-xs text-primary font-medium mb-1 block">
                            {msg.contentType}
                          </span>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                        {msg.role === "ai" && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleCopy(msg.content)}
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 text-primary hover:text-primary"
                              onClick={() => handleUseInEmail(msg.content)}
                            >
                              <ArrowRight className="w-3 h-3" /> Use in Email Automation
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {generating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Generating...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Input Box with animated moving glow border */}
          <div className="p-4">
            <div className="max-w-3xl mx-auto relative">
              <motion.div
                className="absolute -inset-[2px] rounded-2xl opacity-70"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary)) 15%, transparent 30%)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />

              <div className="relative flex items-end gap-2 bg-card/90 backdrop-blur-xl rounded-2xl p-2 border border-border/50">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`e.g. Write a ${contentType.toLowerCase()} for our Tech Conference 2026`}
                  className="min-h-[52px] max-h-32 resize-none bg-transparent border-0 focus-visible:ring-0"
                />
                <Button
                  onClick={handleSend}
                  disabled={generating || !prompt.trim()}
                  size="icon"
                  className="h-[44px] w-[44px] shrink-0 shadow-lg shadow-primary/20"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContentGeneration;