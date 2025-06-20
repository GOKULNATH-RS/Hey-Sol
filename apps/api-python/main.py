from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio, os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.types import Tool, FunctionDeclaration

from typing import Optional
from mcp import ClientSession , StdioServerParameters
from mcp.client.stdio import stdio_client
from contextlib import AsyncExitStack


load_dotenv()  

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found. Add it to your .env file")

        self.genai_client = genai.Client(api_key=gemini_api_key)

    async def connect_to_server(self, server_script_path: str):
        command = "python"
        server_params = StdioServerParameters(
            command=command, args=[server_script_path], env=None
        )

        stdio_transport = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(self.stdio, self.write)
        )

        await self.session.initialize()
        response = await self.session.list_tools()
        tools = response.tools

        print("\nConnected to server with tools:", [tool.name for tool in tools])
        self.function_declarations = convert_mcp_tools_to_gemini(tools)

    async def stream_query(self, query: str):

        user_prompt_content = types.Content(
            role="user",
            parts=[types.Part.from_text(text=query)],
        )

        stream = self.genai_client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=[user_prompt_content],
            config=types.GenerateContentConfig(
                tools=self.function_declarations,
            ),
        )

        tool_call_part = None
        tool_name = None
        tool_args = None

        for chunk in stream:
            print("[Stream Chunk]", chunk)
            if chunk.candidates:
                for part in chunk.candidates[0].content.parts:
                    if part.function_call:
                        tool_call_part = part
                        tool_name = part.function_call.name
                        tool_args = part.function_call.args
                        print(f"[Function Call Detected Tool]: {tool_name}, Args: {tool_args}")
                        break 
                    elif part.text:
                        print(f"[Streaming Text] {part.text}")
                        yield part.text

        if tool_call_part and tool_name:
            print(f"[Calling MCP Tool] {tool_name} with args {tool_args}")
            try:
                result = await self.session.call_tool(tool_name, tool_args)
                function_response = {"result": result.content}
                print(f"[Tool Result] {function_response}")
            except Exception as e:
                function_response = {"error": str(e)}
                print(f"[Tool Error] {e}")

            function_response_part = types.Part.from_function_response(
                name=tool_name,
                response=function_response,
            )

            function_response_content = types.Content(
                role="tool",
                parts=[function_response_part],
            )

            print("Resuming Gemini stream with tool output...")
            follow_up_stream = self.genai_client.models.generate_content_stream(
                model="gemini-2.0-flash",
                contents=[
                    user_prompt_content,
                    tool_call_part,
                    function_response_content,
                ],
                config=types.GenerateContentConfig(
                    tools=self.function_declarations,
                ),
            )

            for follow_chunk in follow_up_stream:
                if follow_chunk.candidates:
                    for part in follow_chunk.candidates[0].content.parts:
                        if part.text:
                            print(f"[Follow-up Text] {part.text}")
                            yield part.text

def convert_mcp_tools_to_gemini(mcp_tools):
    gemini_tools = []
    for tool in mcp_tools:
        parameters = clean_schema(tool.inputSchema)
        function_declaration = FunctionDeclaration(
            name=tool.name,
            description=tool.description,
            parameters=parameters,
        )
        gemini_tool = Tool(function_declarations=[function_declaration])
        gemini_tools.append(gemini_tool)
    return gemini_tools


def clean_schema(schema):
    if isinstance(schema, dict):
        schema.pop("title", None)
        if "properties" in schema and isinstance(schema["properties"], dict):
            for key in schema["properties"]:
                schema["properties"][key] = clean_schema(schema["properties"][key])
    return schema


mcp_client = MCPClient()


@app.on_event("startup")
async def startup_event():
    print("Starting MCP client...")
    await mcp_client.connect_to_server("../mcp-python/main.py")  # Path to your MCP tool server
    print("MCP client initialized")

@app.get("/")
async def root():
    return {"message": "Hello from MCP + Gemini server"}


@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    print("Incoming WebSocket connection...")
    await websocket.accept()
    print("WebSocket connection established.")

    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            print(f"Received message: {user_message}")

            try:
                async for chunk in mcp_client.stream_query(user_message):
                    await websocket.send_json({"type": "stream", "text": chunk})
                await websocket.send_json({"type": "done"})
            except Exception as e:
                print("Processing error:", e)
                await websocket.send_json({"type": "error", "text": str(e)})

    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        print("WebSocket error:", e)
        await websocket.close()
