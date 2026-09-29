import os
from google import genai

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
)

tools = [
    {
        'type': 'google_search',
    },
]

generation_config = {
    'temperature': 1,
    'max_output_tokens': 65536,
    'top_p': 0.95,
    'thinking_level': 'high',
}

prompt = os.environ.get("GEMINI_PROMPT", "Summarize the latest developments in generative AI decision intelligence.")

interaction = client.interactions.create(
    model='models/gemini-3-flash-preview',
    input=prompt,
    tools=tools,
    generation_config=generation_config,
)

print("Interaction ID:", interaction.id)
print("Status:", interaction.status)
print("Last step:")
print(interaction.steps[-1])
