#!/usr/bin/env python3
"""
Unit tests for scripts/generate-content.py

Run:
  python -m pytest scripts/test_generate_content.py -v
  # or:
  python scripts/test_generate_content.py
"""

from __future__ import annotations

import json
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Allow importing the hyphen-named module via importlib
import importlib.util

_scripts_dir = Path(__file__).parent
_spec = importlib.util.spec_from_file_location(
    "generate_content",
    _scripts_dir / "generate-content.py",
)
gc = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
sys.modules["generate_content"] = gc
_spec.loader.exec_module(gc)  # type: ignore[union-attr]


# ─── helpers ──────────────────────────────────────────────────────────────────

def _make_fake_response(content: str) -> MagicMock:
    """Return a mock that looks like an OpenAI ChatCompletion response."""
    msg = MagicMock()
    msg.content = content
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


VALID_OUTLINE = {
    "title": "Test Deck",
    "theme": "tokyo-night",
    "slides": [
        {
            "layout": "cover",
            "title": "Intro",
            "content": "• Point A\n• Point B",
            "notes": "Welcome everyone. " * 15,  # ~200 words-ish
        },
        {
            "layout": "bullets",
            "title": "Overview",
            "content": "• Bullet 1\n• Bullet 2",
            "notes": "Let me walk you through. " * 12,
        },
        {
            "layout": "thanks",
            "title": "Thank you",
            "content": "Questions?",
            "notes": "Thank you for listening. " * 10,
        },
    ],
}


# ─── prompt-builder tests ──────────────────────────────────────────────────────

class TestBuildSystemPrompt(unittest.TestCase):
    def test_contains_language_zh(self):
        prompt = gc.build_system_prompt("zh")
        self.assertIn("Chinese", prompt)

    def test_contains_language_en(self):
        prompt = gc.build_system_prompt("en")
        self.assertIn("English", prompt)

    def test_lists_layouts(self):
        prompt = gc.build_system_prompt("zh")
        self.assertIn("cover", prompt)
        self.assertIn("thanks", prompt)

    def test_lists_themes(self):
        prompt = gc.build_system_prompt("en")
        self.assertIn("tokyo-night", prompt)
        self.assertIn("dracula", prompt)


class TestBuildUserPrompt(unittest.TestCase):
    def test_includes_topic(self):
        prompt = gc.build_user_prompt("AI Safety 101", 6)
        self.assertIn("AI Safety 101", prompt)

    def test_includes_slide_count(self):
        prompt = gc.build_user_prompt("Topic", 10)
        self.assertIn("10", prompt)

    def test_cover_and_thanks_rules(self):
        prompt = gc.build_user_prompt("Topic", 8)
        self.assertIn("cover", prompt.lower())
        self.assertIn("thanks", prompt.lower())


# ─── generate_outline tests ───────────────────────────────────────────────────

class TestGenerateOutline(unittest.TestCase):
    def _run_with_mock(self, response_content: str, env: dict | None = None):
        """Call generate_outline with a mocked OpenAI client."""
        fake_env = {"MINIMAX_API_KEY": "test-key", **(env or {})}
        fake_resp = _make_fake_response(response_content)

        # Inject a fake openai module so we don't need it installed
        fake_openai = types.ModuleType("openai")
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create.return_value = fake_resp
        fake_openai.OpenAI = MagicMock(return_value=mock_client_instance)

        with patch.dict("sys.modules", {"openai": fake_openai}), \
             patch.dict("os.environ", fake_env, clear=False):
            return gc.generate_outline("Test topic", num_slides=3)

    def test_returns_dict_from_valid_json(self):
        result = self._run_with_mock(json.dumps(VALID_OUTLINE))
        self.assertIsInstance(result, dict)
        self.assertEqual(result["title"], "Test Deck")

    def test_strips_markdown_fences(self):
        wrapped = f"```json\n{json.dumps(VALID_OUTLINE)}\n```"
        result = self._run_with_mock(wrapped)
        self.assertEqual(result["theme"], "tokyo-night")

    def test_strips_plain_code_fences(self):
        wrapped = f"```\n{json.dumps(VALID_OUTLINE)}\n```"
        result = self._run_with_mock(wrapped)
        self.assertIn("slides", result)

    def test_strips_thinking_blocks(self):
        """Model may emit <think>...</think> before the JSON (extended thinking)."""
        with_think = f"<think>I need to create slides.\nLet me think...</think>\n{json.dumps(VALID_OUTLINE)}"
        result = self._run_with_mock(with_think)
        self.assertEqual(result["title"], "Test Deck")

    def test_passes_temperature_1(self):
        """MiniMax requires temperature in (0.0, 1.0] — must not be 0."""
        fake_env = {"MINIMAX_API_KEY": "test-key"}
        fake_resp = _make_fake_response(json.dumps(VALID_OUTLINE))

        fake_openai = types.ModuleType("openai")
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_resp
        fake_openai.OpenAI = MagicMock(return_value=mock_client)

        with patch.dict("sys.modules", {"openai": fake_openai}), \
             patch.dict("os.environ", fake_env, clear=False):
            gc.generate_outline("Topic", num_slides=3)

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        temperature = call_kwargs.get("temperature", call_kwargs.get("temperature"))
        self.assertGreater(temperature, 0.0, "temperature must be > 0.0 for MiniMax")
        self.assertLessEqual(temperature, 1.0, "temperature must be <= 1.0 for MiniMax")

    def test_uses_minimax_base_url(self):
        fake_env = {"MINIMAX_API_KEY": "test-key"}
        fake_resp = _make_fake_response(json.dumps(VALID_OUTLINE))

        fake_openai = types.ModuleType("openai")
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_resp
        captured_kwargs: dict = {}

        def capture(**kw):
            captured_kwargs.update(kw)
            return mock_client

        fake_openai.OpenAI = capture

        with patch.dict("sys.modules", {"openai": fake_openai}), \
             patch.dict("os.environ", fake_env, clear=False):
            gc.generate_outline("Topic", num_slides=3)

        base_url = captured_kwargs.get("base_url", "")
        self.assertIn("api.minimax.io", base_url)

    def test_default_model_is_minimax_m27(self):
        self.assertEqual(gc.DEFAULT_MODEL, "MiniMax-M2.7")

    def test_missing_api_key_exits(self):
        fake_openai = types.ModuleType("openai")
        fake_openai.OpenAI = MagicMock()

        with patch.dict("sys.modules", {"openai": fake_openai}), \
             patch.dict("os.environ", {}, clear=True), \
             self.assertRaises(SystemExit):
            gc.generate_outline("Topic")


# ─── constants sanity-checks ──────────────────────────────────────────────────

class TestConstants(unittest.TestCase):
    def test_layouts_not_empty(self):
        self.assertGreater(len(gc.LAYOUTS), 0)

    def test_cover_in_layouts(self):
        self.assertIn("cover", gc.LAYOUTS)

    def test_thanks_in_layouts(self):
        self.assertIn("thanks", gc.LAYOUTS)

    def test_themes_not_empty(self):
        self.assertGreater(len(gc.THEMES), 0)

    def test_tokyo_night_in_themes(self):
        self.assertIn("tokyo-night", gc.THEMES)

    def test_base_url_is_international(self):
        """Must use international domain, not api.minimax.chat."""
        self.assertIn("api.minimax.io", gc.MINIMAX_BASE_URL)
        self.assertNotIn("api.minimax.chat", gc.MINIMAX_BASE_URL)


if __name__ == "__main__":
    unittest.main(verbosity=2)
