# Sends one chat turn to the Conversational Analytics API and checks a
# FINAL_RESPONSE is returned. Run after scaffolding, before deploying.
#
# Usage: python smoke_test.py "What are total sales by region?"
import os
import sys

from google.cloud import geminidataanalytics

PROJECT_ID = os.environ["PROJECT_ID"]
LOCATION = os.environ.get("LOCATION", "global")
DATA_AGENT_NAME = os.environ["DATA_AGENT_NAME"]


def main() -> None:
    question = sys.argv[1] if len(sys.argv) > 1 else "Give me a quick summary of the data."

    client = geminidataanalytics.DataChatServiceClient()
    messages = [geminidataanalytics.Message()]
    messages[0].user_message.text = question

    request = geminidataanalytics.ChatRequest(
        parent=f"projects/{PROJECT_ID}/locations/{LOCATION}",
        messages=messages,
        data_agent_context=geminidataanalytics.DataAgentContext(data_agent=DATA_AGENT_NAME),
    )

    got_final_response = False
    for response in client.chat(request=request, timeout=300):
        text = response.system_message.text
        # text_type serializes as an int (1 == FINAL_RESPONSE) or a string
        # depending on how the response was accessed — check both.
        if text and text.text_type in ("FINAL_RESPONSE", 1):
            got_final_response = True
            print("".join(text.parts))

    if not got_final_response:
        sys.exit("FAILED: no FINAL_RESPONSE received")

    print("\nOK: smoke test passed")


if __name__ == "__main__":
    main()
