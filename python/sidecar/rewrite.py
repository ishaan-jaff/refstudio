import json
import os
import sys

import openai
from dotenv import load_dotenv
from sidecar import prompts
from sidecar.typing import RewriteChoice, RewriteRequest

load_dotenv()
openai.api_key = os.environ.get("OPENAI_API_KEY")


def summarize(arg: RewriteRequest) -> str:
    text = arg.text
    n_choices = arg.n_choices
    temperature = arg.temperature

    prompt = prompts.create_prompt_for_summarize(text)
    chat = Rewriter(prompt, n_choices, temperature)
    response = chat.get_response()
    sys.stdout.write(json.dumps([r.dict() for r in response]))


class Rewriter:
    def __init__(self, text: str, n_choices: int = 1, temperature: float = 0.7):
        self.text = text
        self.n_choices = int(n_choices)
        self.temperature = temperature

    def get_response(self):
        messages = self.prepare_messages_for_chat(self.text)
        response = self.call_model(messages)
        response = self.prepare_choices_for_client(response)
        return response

    def prepare_choices_for_client(self, response: dict) -> list[RewriteChoice]:
        return [
            RewriteChoice(index=choice['index'], text=choice["message"]["content"])
            for choice in response['choices']
        ]

    def call_model(self, messages: list):
        response = openai.ChatCompletion.create(
            model=os.environ["OPENAI_CHAT_MODEL"],
            messages=messages,
            n=self.n_choices,  # number of completions to generate
            temperature=self.temperature,  # 0 = no randomness, deterministic
        )
        return response

    def prepare_messages_for_chat(self, text: str) -> list:
        messages = [
            {"role": "user", "content": text},
        ]
        return messages
