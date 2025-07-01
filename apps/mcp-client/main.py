from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from fastmcp import Client
from fastmcp.client.transports import NodeStdioTransport
from google import genai

import functools
import asyncio, os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MCPClient:
    def __init__(self):
        self.session = None
    
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found. Add it to your .env file")
        
        self.genai_client = genai.Client(api_key=gemini_api_key)
        self.mcp_tools = None


    async def connect_to_server(self):
        """Connect to the MCP server and initialize the session."""

        node_server_script="../mcp-server/dist/index.js"

        transport = NodeStdioTransport(
            script_path=node_server_script,
            node_cmd="node",
        )
        
        mcp_client = Client(transport)
        await mcp_client.__aenter__()  # Connects the client
        print(f"Client connected: {mcp_client.is_connected()}")

        if not mcp_client.is_connected():
            await mcp_client.connect()
        
        self.session = mcp_client.session 


        if not self.session:
            raise ValueError("Failed to connect to MCP server")
        
        tools = await convert_tools_to_genai_format(mcp_client)
        self.mcp_tools = tools


    async def stream_query(self, query: str, websocket: Optional[WebSocket] = None):
        if not self.session:
            raise ValueError("MCP client session is not initialized")
        
        user_prompt_content = genai.types.Content(
            role="user",
            parts=[genai.types.Part.from_text(text=query)]
        )

        stream = await self.genai_client.aio.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=[user_prompt_content],
            config=genai.types.GenerateContentConfig(
                temperature=0.5,
                tools=self.mcp_tools,  
            ),
        )
        
        tool_call_part = None
        tool_name = None
        tool_args = None

        async for chunk in stream:
            print("[Stream Chunk]", chunk)
            if chunk.candidates:
                for part in chunk.candidates[0].content.parts:
                    if part.function_call:
                        tool_call_part = part
                        tool_name = part.function_call.name
                        tool_args = part.function_call.args
                        if websocket:
                            await websocket.send_json({
                                "type": "function_call",
                                "name": tool_name,
                                "args": tool_args
                            })
                        
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

            function_response_part = genai.types.Part.from_function_response(
                name=tool_name,
                response=function_response,
            )

            function_response_content = genai.types.Content(
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
                config=genai.types.GenerateContentConfig(
                    temperature=0.5,
                    tools=self.mcp_tools,  # Pass the FastMCP client session
                ),
            )

            for follow_chunk in follow_up_stream:
                if follow_chunk.candidates:
                    for part in follow_chunk.candidates[0].content.parts:
                        if part.text:
                            print(f"[Follow-up Text] {part.text}")
                            yield part.text


mcp_client_class = MCPClient()

@app.on_event("startup")
async def startup_event():
    print("Starting MCP Client...")
    await mcp_client_class.connect_to_server()


def has_format_key(schema):
    """Recursively check if 'format' key exists in schema."""

    if isinstance(schema, dict):
        if 'format' in schema:
            return True
        return any(has_format_key(value) for value in schema.values())
    elif isinstance(schema, list):
        return any(has_format_key(item) for item in schema)
    return False


def remove_format_key(schema):
    """Recursively remove 'format' key from schema."""
    if isinstance(schema, dict):
        schema.pop('format', None)
        for value in schema.values():
            remove_format_key(value)
    elif isinstance(schema, list):
        for item in schema:
            remove_format_key(item)


async def convert_tools_to_genai_format(mcp_client):
    """Convert MCP tools to GenAI format, print and clean only those with 'format' in input_schema."""
    genai_tools = []
    async with mcp_client:
        tools = await mcp_client.list_tools()
        for tool in tools:
            if has_format_key(tool.inputSchema):
                # format ket exists, convert and clean the tool
                remove_format_key(tool.inputSchema)

            function_declaration = genai.types.FunctionDeclaration(
                name=tool.name,
                description=tool.description,
                parameters_json_schema=tool.inputSchema,
            )
            gemini_tool = genai.types.Tool(function_declarations=[function_declaration])
            genai_tools.append(gemini_tool)

    return genai_tools
    


@app.get("/")
async def root():
    """Root endpoint to check if the server is running."""
    return {"message": "Welcome to the MCP Client API"}


@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get('message', '')
            print(f"Received query: {user_message}")

            try:
                async for chunk in mcp_client_class.stream_query(user_message,websocket):
                    await websocket.send_json({"type": "stream", "text": chunk})
                await websocket.send_json({"type": "done"})

            except Exception as e:
                print(f"Error processing query: {e}")
                await websocket.send_json({"type": "error", "text": str(e)})
            
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=1000, reason=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8002, log_level="info")
    print("Server started at http://localhost:8002")