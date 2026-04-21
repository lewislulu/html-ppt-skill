#!/usr/bin/env python3
"""
html-ppt :: generate-content.py — AI-powered slide content generator

Uses MiniMax-M2.7 (OpenAI-compatible API) to generate a structured slide
outline from a topic, which you can then turn into a deck with new-deck.sh.

Usage:
  python scripts/generate-content.py "LangChain 入门" --slides 8 --lang zh
  python scripts/generate-content.py "AI Safety 101" --slides 6 --lang en --output my-outline.json

Environment:
  MINIMAX_API_KEY   required — your MiniMax API key (https://platform.minimax.io)

Output (JSON):
  {
    "title": "Deck title",
    "theme": "suggested theme name",
    "slides": [
      {
        "layout": "layout type (e.g. cover, bullets, two-column, kpi-grid)",
        "title": "slide title",
        "content": "main content / bullet points",
        "notes": "speaker notes (100–200 words)"
      },
      ...
    ]
  }

Pipe into jq or drop the JSON into your deck for a quick starting point.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

MINIMAX_BASE_URL = "https://api.minimax.io/v1"
DEFAULT_MODEL = "MiniMax-M2.7"

# Available layouts in html-ppt (for the model to pick from)
LAYOUTS = [
    "cover", "toc", "section-divider", "bullets", "two-column", "three-column",
    "big-quote", "stat-highlight", "kpi-grid", "table", "code", "diff",
    "terminal", "flow-diagram", "timeline", "roadmap", "mindmap", "comparison",
    "pros-cons", "todo-checklist", "gantt", "image-hero", "image-grid",
    "chart-bar", "chart-line", "chart-pie", "chart-radar", "arch-diagram",
    "process-steps", "cta", "thanks",
]

# Available themes in html-ppt (for the model to pick from)
THEMES = [
    "minimal-white", "editorial-serif", "soft-pastel", "sharp-mono",
    "arctic-cool", "sunset-warm", "catppuccin-latte", "catppuccin-mocha",
    "dracula", "tokyo-night", "nord", "solarized-light", "gruvbox-dark",
    "rose-pine", "neo-brutalism", "glassmorphism", "bauhaus", "swiss-grid",
    "terminal-green", "xiaohongshu-white", "rainbow-gradient", "aurora",
    "blueprint", "memphis-pop", "cyberpunk-neon", "y2k-chrome", "retro-tv",
    "japanese-minimal", "vaporwave", "midcentury", "corporate-clean",
    "academic-paper", "news-broadcast", "pitch-deck-vc", "magazine-bold",
    "engineering-whiteprint",
]


def build_system_prompt(lang: str) -> str:
    lang_label = "Chinese (Simplified)" if lang == "zh" else "English"
    return (
        f"You are an expert presentation designer specialising in clear, engaging decks. "
        f"Generate structured slide content in {lang_label}. "
        f"Output valid JSON only — no markdown fences, no explanation. "
        f"Available layouts: {', '.join(LAYOUTS)}. "
        f"Available themes: {', '.join(THEMES)}."
    )


def build_user_prompt(topic: str, num_slides: int) -> str:
    return f"""Create a {num_slides}-slide presentation for: "{topic}"

Return this exact JSON structure:
{{
  "title": "<deck title>",
  "theme": "<one theme from the available list that fits the topic>",
  "slides": [
    {{
      "layout": "<one layout from the available list>",
      "title": "<slide title>",
      "content": "<main content — bullet points separated by \\n, or a short paragraph>",
      "notes": "<speaker notes, 100–200 words, conversational tone>"
    }}
  ]
}}

Rules:
- First slide must use layout "cover".
- Last slide must use layout "thanks".
- Vary layouts — avoid repeating the same layout more than twice in a row.
- notes must be 100–200 words, written as if spoken aloud (not read).
- Return only valid JSON, nothing else."""


def generate_outline(
    topic: str,
    num_slides: int = 8,
    lang: str = "zh",
    model: str = DEFAULT_MODEL,
) -> dict:
    """Call MiniMax-M2.7 and return a parsed slide outline dict."""
    try:
        from openai import OpenAI  # type: ignore
    except ImportError:
        sys.exit(
            "error: openai package not found.\n"
            "Install it with:  pip install openai"
        )

    api_key = os.environ.get("MINIMAX_API_KEY")
    if not api_key:
        sys.exit(
            "error: MINIMAX_API_KEY environment variable is not set.\n"
            "Get a key at https://platform.minimax.io and export it:\n"
            "  export MINIMAX_API_KEY=<your-key>"
        )

    client = OpenAI(api_key=api_key, base_url=MINIMAX_BASE_URL)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": build_system_prompt(lang)},
            {"role": "user", "content": build_user_prompt(topic, num_slides)},
        ],
        temperature=1.0,  # MiniMax requires temperature in (0.0, 1.0]
        max_tokens=4096,
    )

    raw = response.choices[0].message.content.strip()

    # Strip extended-thinking blocks (<think>...</think>) that some models emit
    import re
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()

    # Strip accidental markdown code fences
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        sys.exit(f"error: model returned invalid JSON: {exc}\nRaw response:\n{raw}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate slide outlines with MiniMax-M2.7",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("topic", help="Presentation topic or title")
    parser.add_argument(
        "--slides", type=int, default=8, metavar="N",
        help="Number of slides to generate (default: 8)",
    )
    parser.add_argument(
        "--lang", choices=["zh", "en"], default="zh",
        help="Content language: zh (Chinese) or en (English) (default: zh)",
    )
    parser.add_argument(
        "--output", default="outline.json", metavar="FILE",
        help="Output JSON file path (default: outline.json)",
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL,
        help=f"MiniMax model to use (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--print", dest="print_json", action="store_true",
        help="Also print the JSON to stdout",
    )
    args = parser.parse_args()

    print(f"Generating {args.slides}-slide outline …")
    print(f"  Topic : {args.topic!r}")
    print(f"  Model : {args.model}")
    print(f"  Lang  : {args.lang}")

    outline = generate_outline(
        topic=args.topic,
        num_slides=args.slides,
        lang=args.lang,
        model=args.model,
    )

    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump(outline, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"\n✔ Saved to {args.output}")
    print(f"  Title  : {outline.get('title', '(no title)')}")
    print(f"  Theme  : {outline.get('theme', '(no theme)')}")
    print(f"  Slides : {len(outline.get('slides', []))}")

    if args.print_json:
        print("\n" + json.dumps(outline, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
