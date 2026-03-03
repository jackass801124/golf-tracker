import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, TrendingUp, Target, Activity } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: "分析我的成績趨勢", prompt: "請分析我最近的成績趨勢，指出進步或退步的地方" },
  { icon: Target, label: "推桿改善建議", prompt: "根據我的推桿數據，給我具體的推桿練習建議" },
  { icon: Activity, label: "弱點洞分析", prompt: "哪些洞是我的弱點？如何針對這些洞進行改善？" },
  { icon: Sparkles, label: "整體訓練計畫", prompt: "根據我的整體數據，幫我制定一個月的訓練計畫" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "您好！我是您的 AI 高爾夫教練。我已分析您的下場數據，可以針對您的成績提供個人化建議。\n\n您可以問我任何關於改善球技的問題，或使用下方的快速提示開始對話。",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: stats } = trpc.stats.summary.useQuery();
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      setIsLoading(false);
    },
    onError: () => {
      toast.error("AI 回應失敗，請重試");
      setIsLoading(false);
    },
  });

  const fullAnalysisMutation = trpc.ai.fullAnalysis.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.analysis }]);
      setIsLoading(false);
    },
    onError: () => {
      toast.error("分析失敗，請重試");
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content: string) => {
    if (!content.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    chatMutation.mutate({
      messages: [...messages, userMsg],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-0px)] animate-fade-in">
      {/* Header */}
      <div className="border-b-2 border-black px-6 lg:px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="swiss-label">AI GOLF COACH</p>
            <h1 className="text-2xl font-black tracking-tight">AI 教練助理</h1>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              fullAnalysisMutation.mutate();
            }}
            disabled={isLoading || (stats?.totalRounds ?? 0) === 0}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            <Sparkles size={12} />
            {isLoading ? "分析中..." : "完整數據分析"}
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="flex items-center gap-6 mt-3">
            {[
              { label: "AVG SCORE", value: stats.avgScore?.toFixed(1) ?? "—" },
              { label: "BEST", value: stats.bestScore?.toString() ?? "—" },
              { label: "ROUNDS", value: stats.totalRounds?.toString() ?? "0" },
              { label: "AVG PUTTS", value: stats.avgPutts?.toFixed(1) ?? "—" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-sm font-black">{s.value}</div>
                <div className="swiss-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center ${
              msg.role === "assistant" ? "bg-black" : "bg-[oklch(0.55_0.22_27.33)]"
            }`}>
              {msg.role === "assistant" ? (
                <Bot size={13} className="text-white" />
              ) : (
                <User size={13} className="text-white" />
              )}
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-black text-white"
                  : "bg-gray-50 border border-gray-200 text-gray-800"
              }`}>
                {msg.role === "assistant" ? (
                  <Streamdown className="prose prose-sm max-w-none text-gray-800">
                    {msg.content}
                  </Streamdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 bg-black flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-gray-50 border border-gray-200 px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-6 lg:px-8 py-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qp.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1.5 border border-gray-200 px-3 py-1.5 text-xs font-bold whitespace-nowrap hover:border-black hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <qp.icon size={10} />
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 lg:px-8 py-4 border-t-2 border-black flex-shrink-0">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入問題，或按 Enter 發送..."
            rows={2}
            disabled={isLoading}
            className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="swiss-label mt-2">ENTER 發送 · SHIFT+ENTER 換行</p>
      </div>
    </div>
  );
}
