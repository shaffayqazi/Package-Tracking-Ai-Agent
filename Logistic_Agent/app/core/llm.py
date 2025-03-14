from langchain.llms.base import LLM
from typing import Any
import requests
import json

class OllamaLLM(LLM):
    base_url: str = "http://localhost:11434"
    model: str = "llama3.1"

    def _call(self, prompt: str, **kwargs: Any) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt
        }

        full_response = ""
        response = requests.post(url, json=payload, stream=True)
        
        for line in response.iter_lines():
            if line:
                try:
                    data = json.loads(line.decode("utf-8"))
                    full_response += data.get("response", "")
                except json.JSONDecodeError:
                    continue
                    
        return full_response.strip()

    @property
    def _llm_type(self) -> str:
        return "ollama" 