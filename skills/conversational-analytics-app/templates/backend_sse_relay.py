# Minimal FastAPI backend relaying Conversational Analytics API chat streams over SSE.
# Adapt this rather than generating from scratch. See ../reference/data-agent-context.md
# and ../reference/backend-deployment.md for the full architecture behind this.
#
# This example uses a persistent DataAgent with a stateless conversation
# (no conversation_reference). To switch to stateful history, create a
# Conversation once via DataChatServiceClient.create_conversation() and pass
# ChatRequest.conversation_reference instead — see the "Conversation state"
# section in reference/data-agent-context.md.
import json
import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.cloud import bigquery, geminidataanalytics

PROJECT_ID = os.environ["PROJECT_ID"]
LOCATION = os.environ.get("LOCATION", "global")
DATA_AGENT_NAME = os.environ["DATA_AGENT_NAME"]
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "*")
# Table must already exist — see ../reference/feedback-capture.md for the DDL.
FEEDBACK_TABLE = os.environ.get("FEEDBACK_TABLE", f"{PROJECT_ID}.analytics.feedback")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["POST"],
    allow_headers=["*"],
)

chat_client = geminidataanalytics.DataChatServiceClient()
bq_client = bigquery.Client()


@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    user_text = body["message"]

    messages = [geminidataanalytics.Message()]
    messages[0].user_message.text = user_text

    chat_request = geminidataanalytics.ChatRequest(
        parent=f"projects/{PROJECT_ID}/locations/{LOCATION}",
        messages=messages,
        data_agent_context=geminidataanalytics.DataAgentContext(data_agent=DATA_AGENT_NAME),
    )

    def event_stream():
        for response in chat_client.chat(request=chat_request, timeout=300):
            # Protobuf enums (e.g. text_type) serialize as ints here — the
            # frontend must handle both int and string forms.
            payload = response.__class__.to_json(response)
            yield f"data: {payload}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# 5-star + comment feedback capture — see ../reference/feedback-capture.md.
# Keyed by a client-generated turn_id, not the API's own messageId (which is
# unreliable — see ../reference/api-quirks-and-events.md).
@app.post("/feedback")
async def feedback(request: Request):
    body = await request.json()

    row = {
        "session_id": body.get("session_id"),
        "turn_id": body.get("turn_id"),
        "question": body.get("question"),
        "answer": body.get("answer"),
        "rating": body["rating"],
        "comment": body.get("comment"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    errors = bq_client.insert_rows_json(FEEDBACK_TABLE, [row])
    if errors:
        raise HTTPException(status_code=500, detail=str(errors))

    return {"status": "ok"}
