"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiAPI } from "@/lib/api";
import { Send, Sparkles, User, RefreshCw, MessageCircle, PanelLeftClose, PanelLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Review my resume and suggest improvements",
  "Help me prepare for a software engineering interview",
  "What are the best strategies for salary negotiation?",
  "How do I transition from backend to full-stack development?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversation history
  const { data: conversations } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: () => aiAPI.conversations().then((r) => r.data),
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      aiAPI.chat({
        message,
        conversation_id: conversationId || undefined,
        context_type: "general",
      }),
    onSuccess: (response) => {
      const data = response.data;
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      // Refresh conversation list
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    },
  });

  const handleSend = (message?: string) => {
    const text = message || input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    chatMutation.mutate(text);
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const selectConversation = (conv: any) => {
    setConversationId(conv.id);
    // Load messages from conversation if available
    if (conv.messages?.length) {
      setMessages(
        conv.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        }))
      );
    } else {
      setMessages([]);
    }
    setShowHistory(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Conversation History Sidebar */}
      <div
        className={`${
          showHistory ? "w-72 border-r border-gray-100" : "w-0"
        } transition-all duration-200 overflow-hidden bg-white dark:bg-gray-900 rounded-l-2xl shrink-0`}
      >
        <div className="w-72 h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Conversations</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <PanelLeftClose className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
            <button
              onClick={startNewConversation}
              className="w-full mt-3 px-3 py-2 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/30 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-800/30 transition-colors"
            >
              + New conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations?.length > 0 ? (
              conversations.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${
                    conversationId === conv.id
                      ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-medium">
                      {conv.title || conv.preview || "Conversation"}
                    </span>
                  </div>
                  {conv.updated_at && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-5.5">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">
                No conversations yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {!showHistory && (
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Show conversations"
              >
                <PanelLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Career Coach</h1>
              <p className="text-gray-500 text-sm">
                Your personal career advisor, powered by AI
              </p>
            </div>
          </div>
          <button
            onClick={startNewConversation}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            title="New conversation"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-brand-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
                I can help with resume reviews, interview prep, career advice,
                salary negotiation, and more.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-brand-200 hover:bg-brand-50/50 transition-colors text-sm text-gray-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
              </div>
            ))
          )}

          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-brand-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your career..."
              className="input-field flex-1"
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="btn-primary !p-3 rounded-xl disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
