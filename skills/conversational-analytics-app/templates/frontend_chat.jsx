// Minimal chat UI for the Conversational Analytics backend's /chat SSE endpoint.
// See ../reference/frontend-ux.md for the full component checklist (data
// tables, Vega-Lite charts, debug drawer, session sidebar, etc) and
// ../reference/feedback-capture.md for the star-rating control below.
import { useState } from "react";
import Feedback from "./frontend_feedback.jsx";
import DataTable from "./frontend_data_table.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// Tags feedback submissions to a browser tab session — this template's
// backend is stateless (see backend_sse_relay.py), so it isn't sent to
// /chat itself. Pair with ChatRequest.conversation_reference (see
// ../reference/data-agent-context.md) if you want multi-turn context too.
const sessionId = crypto.randomUUID();

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const userText = input;
    const turnId = crypto.randomUUID();
    setMessages((m) => [...m, { role: "user", text: userText, turnId }]);
    setInput("");
    setThinking(true);

    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop();

      for (const event of events) {
        const line = event.replace(/^data: /, "");
        if (line) handleMessage(JSON.parse(line), userText, turnId);
      }
    }
    setThinking(false);
  }

  function handleMessage(payload, question, turnId) {
    const text = payload.systemMessage?.text;
    if (text) {
      // textType serializes as an int or a string depending on the SDK version.
      if (text.textType === "FINAL_RESPONSE" || text.textType === 1) {
        const answer = text.parts?.join("");
        setMessages((m) => [...m, { role: "agent", text: answer, turnId, question }]);
      }
      return;
    }

    // A single question typically produces a "query dispatched" data message
    // first (query only, no result yet) — skip until result is populated.
    const result = payload.systemMessage?.data?.result;
    if (result) {
      setMessages((m) => [...m, { role: "data", result, turnId }]);
    }
  }

  return (
    <div>
      <div className="thread">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>
            {m.role === "data" ? <DataTable result={m.result} /> : m.text}
            {m.role === "agent" && (
              <Feedback sessionId={sessionId} turnId={m.turnId} question={m.question} answer={m.text} />
            )}
          </div>
        ))}
        {thinking && <div className="thinking">Thinking...</div>}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
