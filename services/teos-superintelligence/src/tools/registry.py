"""
TEOS Tool Registry
Tools with Sentinel checks on both input and output.
Includes RAG search tool for vector store queries.
"""
import io
import logging
import ast
import operator as op
from typing import Any, Optional

import httpx
from pypdf import PdfReader

logger = logging.getLogger(__name__)

_sentinel = None
_vector_store = None


def _get_sentinel():
    global _sentinel
    if _sentinel is None:
        from src.security.sentinel import SentinelClient
        _sentinel = SentinelClient()
    return _sentinel


def _get_vector_store():
    global _vector_store
    if _vector_store is None:
        from src.rag.vector_store import VectorStore
        _vector_store = VectorStore()
    return _vector_store


class TEOSTool:
    name: str = "base"
    description: str = "Base tool"

    async def validate_input(self, **kwargs) -> dict:
        payload = f"TOOL_INPUT:{self.name}:{str(kwargs)}"
        verdict = await _get_sentinel().check(payload, user_id="tool_registry")
        if verdict["action"] == "BLOCK":
            logger.warning(f"Sentinel blocked tool input: {self.name}")
            return {"error": "Input blocked by safety layer", "blocked": True}
        return {"blocked": False}

    async def validate_output(self, result: Any) -> dict:
        payload = f"TOOL_OUTPUT:{self.name}:{str(result)[:1000]}"
        verdict = await _get_sentinel().check(payload, user_id="tool_registry")
        if verdict["action"] == "BLOCK":
            logger.warning(f"Sentinel blocked tool output: {self.name}")
            return {"error": "Output blocked by safety layer", "blocked": True}
        return {"blocked": False}

    async def run(self, **kwargs) -> dict:
        raise NotImplementedError


class WebSearchTool(TEOSTool):
    name = "web_search"
    description = "Search the web for current information"

    async def run(self, query: str, max_results: int = 5) -> dict:
        input_check = await self.validate_input(query=query)
        if input_check.get("blocked"):
            return input_check

        results = await self._search(query, max_results)

        output_check = await self.validate_output(results)
        if output_check.get("blocked"):
            return output_check

        return {"results": results, "tool": self.name}

    async def _search(self, query: str, max_results: int) -> list[dict]:
        items = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.duckduckgo.com",
                    params={"q": query, "format": "json", "no_html": 1},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    abstract = data.get("AbstractText", "")
                    if abstract:
                        items.append({
                            "title": data.get("Heading", ""),
                            "snippet": abstract,
                            "source": "DuckDuckGo",
                        })
        except Exception as e:
            logger.warning(f"Web search failed: {e}")

        if not items:
            items.append({
                "title": "Search unavailable",
                "snippet": "Web search could not be completed",
                "source": "system",
            })
        return items[:max_results]


class DocumentParserTool(TEOSTool):
    name = "document_parser"
    description = "Parse and extract text from PDF documents"

    async def run(self, content: bytes, filename: str = "") -> dict:
        input_check = await self.validate_input(filename=filename)
        if input_check.get("blocked"):
            return input_check

        result = await self._parse(content, filename)

        output_check = await self.validate_output(result)
        if output_check.get("blocked"):
            return output_check

        return result

    async def _parse(self, content: bytes, filename: str) -> dict:
        if filename.lower().endswith(".pdf"):
            try:
                reader = PdfReader(io.BytesIO(content))
                pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(text)
                full_text = "\n\n".join(pages)
                return {
                    "text": full_text,
                    "pages": len(pages),
                    "tool": self.name,
                    "file_type": "pdf",
                }
            except Exception as e:
                return {"error": f"PDF parsing failed: {e}", "tool": self.name}
        else:
            try:
                text = content.decode("utf-8")
                return {
                    "text": text,
                    "pages": 1,
                    "tool": self.name,
                    "file_type": "text",
                }
            except UnicodeDecodeError:
                return {"error": "Unsupported file format", "tool": self.name}


class CalculatorTool(TEOSTool):
    name = "calculator"
    description = "Evaluate mathematical expressions safely"

    async def run(self, expression: str) -> dict:
        input_check = await self.validate_input(expression=expression)
        if input_check.get("blocked"):
            return input_check

        result = self._evaluate(expression)

        output_check = await self.validate_output(result)
        if output_check.get("blocked"):
            return output_check

        return {"result": result, "expression": expression, "tool": self.name}

    def _evaluate(self, expression: str) -> Any:
        MAX_OPERAND = 10**15
        MAX_RESULT = 10**100
        MAX_DEPTH = 20

        allowed_ops = {
            ast.Add: op.add,
            ast.Sub: op.sub,
            ast.Mult: op.mul,
            ast.Div: op.truediv,
            ast.Pow: op.pow,
            ast.USub: op.neg,
            ast.Mod: op.mod,
            ast.FloorDiv: op.floordiv,
        }

        def _eval(node, depth=0):
            if depth > MAX_DEPTH:
                raise ValueError("Expression too deeply nested")
            if isinstance(node, ast.Constant):
                if isinstance(node.value, (int, float)):
                    if isinstance(node.value, int) and abs(node.value) > MAX_OPERAND:
                        raise ValueError("Operand too large")
                    return node.value
                raise ValueError(f"Unsupported constant: {node.value}")
            elif isinstance(node, ast.UnaryOp):
                if type(node.op) in allowed_ops:
                    result = allowed_ops[type(node.op)](_eval(node.operand, depth + 1))
                    if isinstance(result, (int, float)) and abs(result) > MAX_RESULT:
                        raise ValueError("Result too large")
                    return result
            elif isinstance(node, ast.BinOp):
                if type(node.op) in allowed_ops:
                    left = _eval(node.left, depth + 1)
                    right = _eval(node.right, depth + 1)
                    if isinstance(left, int) and abs(left) > MAX_OPERAND:
                        raise ValueError("Operand too large")
                    if isinstance(right, int) and abs(right) > MAX_OPERAND:
                        raise ValueError("Operand too large")
                    result = allowed_ops[type(node.op)](left, right)
                    if isinstance(result, (int, float)) and abs(result) > MAX_RESULT:
                        raise ValueError("Result too large")
                    return result
            raise ValueError(f"Unsupported operation: {type(node).__name__}")

        try:
            tree = ast.parse(expression.strip(), mode="eval")
            return _eval(tree.body)
        except Exception as e:
            return f"Error: {e}"


class RAGSearchTool(TEOSTool):
    name = "rag_search"
    description = "Search the internal knowledge base (RAG vector store)"

    async def run(self, query: str, n_results: int = 5) -> dict:
        input_check = await self.validate_input(query=query)
        if input_check.get("blocked"):
            return input_check

        results = _get_vector_store().search(query, n_results=n_results)

        output_check = await self.validate_output(results)
        if output_check.get("blocked"):
            return output_check

        return {"results": results, "tool": self.name, "total": len(results)}


_TOOL_CLASSES = [WebSearchTool, DocumentParserTool, CalculatorTool, RAGSearchTool]


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, TEOSTool] = {}
        for cls in _TOOL_CLASSES:
            instance = cls()
            self._tools[instance.name] = instance
        logger.info(f"Registered tools: {list(self._tools.keys())}")

    def get(self, name: str) -> Optional[TEOSTool]:
        return self._tools.get(name)

    def list_tools(self) -> list[dict]:
        return [
            {"name": t.name, "description": t.description}
            for t in self._tools.values()
        ]

    def register_external(self, name: str, tool: TEOSTool) -> None:
        self._tools[name] = tool
        logger.info("Registered external tool: %s", name)

    async def run_tool(self, name: str, **kwargs) -> dict:
        tool = self.get(name)
        if not tool:
            return {"error": f"Tool '{name}' not found"}
        return await tool.run(**kwargs)
