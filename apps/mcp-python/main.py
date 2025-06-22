from mcp.server.fastmcp import FastMCP


mcp = FastMCP("SOL Based Marketplace MCP")


@mcp.tool()
async def add(a: int, b: int) -> int:
    """
    Adds two number a and b

    Args:
        a : first number
        b : second number
    """

    return a + b


@mcp.tool()
async def subtract(a: int, b: int) -> int:
    """
    Adds two number a and b

    Args:
        a : first number
        b : second number
    """

    return a - b



@mcp.tool()
async def multiply(a: int, b: int) -> int:
    """
    Adds two number a and b

    Args:
        a : first number
        b : second number
    """

    return a + b


if __name__ == "__main__":
    mcp.run(transport='stdio')