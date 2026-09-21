// Minimal 5-star + comment feedback control for one agent response.
// See ../reference/feedback-capture.md for why messageId isn't used to key
// this (it's unreliable — see ../reference/api-quirks-and-events.md) and a
// client-generated turnId is used instead.
import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function Feedback({ sessionId, turnId, question, answer }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit(nextRating, nextComment) {
    setRating(nextRating);
    setSubmitted(true);

    // Fire-and-forget: never block or error out the chat UI on this.
    fetch(`${BACKEND_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        turn_id: turnId,
        question,
        answer,
        rating: nextRating,
        comment: nextComment || null,
      }),
    }).catch((err) => console.error("feedback submit failed:", err));
  }

  if (submitted) {
    return <div className="feedback submitted">Thanks for the feedback!</div>;
  }

  return (
    <div className="feedback">
      <div className="stars" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            className={n <= (hoverRating || rating) ? "star filled" : "star"}
            onMouseEnter={() => setHoverRating(n)}
            onClick={() => submit(n, comment)}
          >
            ★
          </button>
        ))}
      </div>
      <input
        className="feedback-comment"
        placeholder="Anything to add? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={() => rating > 0 && comment && submit(rating, comment)}
      />
    </div>
  );
}
