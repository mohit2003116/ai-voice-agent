import asyncio
from dotenv import load_dotenv
load_dotenv('.env.local')
from livekit.plugins import google
from livekit.agents import llm

MODELS = [
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
]

async def test():
    for m in MODELS:
        try:
            print(f'Testing {m}...', flush=True)
            g_llm = google.LLM(model=m)
            chat_ctx = llm.ChatContext()
            chat_ctx.add_message(role='user', content='Say hello in 3 words')
            stream = g_llm.chat(chat_ctx=chat_ctx)
            resp = ''
            async for chunk in stream:
                try:
                    content = chunk.choices[0].delta.content
                    if content:
                        resp += content
                except (AttributeError, IndexError):
                    try:
                        if hasattr(chunk, 'delta') and chunk.delta:
                            resp += str(chunk.delta)
                    except Exception:
                        pass
            result = resp.strip()
            print(f'  SUCCESS [{m}]: got response len={len(result)}', flush=True)
        except Exception as e:
            err = str(e)[:300]
            print(f'  FAIL [{m}]: {err}', flush=True)

asyncio.run(test())
