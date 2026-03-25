#!/usr/bin/env python3
"""
UI/UX Pro Max Search Helper Script

This script provides a command-line interface to search the UI/UX Pro Max
design intelligence database for styles, colors, typography, products, 
UX guidelines, and more.

Usage:
    python ui_ux_search.py "<query>" --domain <domain> [-n <max_results>]
    python ui_ux_search.py "<query>" --design-system [-p "Project Name"]
    python ui_ux_search.py "<query>" --stack <stack>

Examples:
    python ui_ux_search.py "beauty spa wellness" --design-system -p "Serenity Spa"
    python ui_ux_search.py "minimalism dark mode" --domain style
    python ui_ux_search.py "fintech dashboard" --domain product
    python ui_ux_search.py "animation accessibility" --domain ux
    python ui_ux_search.py "list performance" --stack react-native

Available Domains:
    - product     : Product type recommendations
    - style       : UI styles with CSS keywords and AI prompts
    - typography  : Font pairings with Google Fonts
    - color       : Color palettes by product type
    - landing     : Landing page structures and CTA strategies
    - chart       : Chart types and library recommendations
    - ux          : UX best practices and anti-patterns
    - google-fonts: Individual Google Fonts lookup
    - prompt      : AI prompts and CSS keywords

Available Stacks:
    - react-native, react, nextjs, vue, nuxtjs, svelte
    - swiftui, flutter, tailwind, shadcn, jetpack-compose
"""

import argparse
import csv
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# Data file paths
DATA_DIR = Path(__file__).parent / ".qwen" / "ui-ux-data" / "data"
STACKS_DIR = DATA_DIR / "stacks"

DOMAIN_FILES = {
    "product": "products.csv",
    "style": "styles.csv",
    "typography": "typography.csv",
    "color": "colors.csv",
    "landing": "landing.csv",
    "chart": "charts.csv",
    "ux": "ux-guidelines.csv",
    "google-fonts": "google-fonts.csv",
    "design": "design.csv",
    "app-interface": "app-interface.csv",
    "react-performance": "react-performance.csv",
}


def load_csv(filepath: Path) -> List[Dict[str, str]]:
    """Load a CSV file and return as list of dictionaries."""
    if not filepath.exists():
        print(f"Error: Data file not found: {filepath}")
        return []
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return []


def search_keyword(text: str, query: str) -> int:
    """Simple keyword matching score."""
    if not text or not query:
        return 0
    
    text_lower = text.lower()
    query_words = query.lower().split()
    score = 0
    
    for word in query_words:
        if word in text_lower:
            score += 1
        # Partial match
        if len(word) > 3:
            pattern = r'\b' + re.escape(word[:4])
            if re.search(pattern, text_lower):
                score += 0.5
    
    return score


def search_domain(domain: str, query: str, max_results: int = 5) -> List[Dict]:
    """Search within a specific domain."""
    if domain not in DOMAIN_FILES:
        print(f"Unknown domain: {domain}")
        print(f"Available domains: {', '.join(DOMAIN_FILES.keys())}")
        return []
    
    filepath = DATA_DIR / DOMAIN_FILES[domain]
    data = load_csv(filepath)
    
    if not data:
        return []
    
    # Score and sort results
    scored_results = []
    for row in data:
        # Search across all fields
        combined_text = " ".join(str(v) for v in row.values())
        score = search_keyword(combined_text, query)
        
        if score > 0:
            scored_results.append((score, row))
    
    # Sort by score descending
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    return [row for score, row in scored_results[:max_results]]


def generate_design_system(query: str, project_name: Optional[str] = None) -> Dict:
    """
    Generate a complete design system based on query.
    Searches multiple domains and combines results with reasoning.
    """
    print(f"\n{'='*60}")
    print(f"DESIGN SYSTEM GENERATION")
    if project_name:
        print(f"Project: {project_name}")
    print(f"Query: {query}")
    print(f"{'='*60}\n")
    
    # Search multiple domains
    product_results = search_domain("product", query, max_results=3)
    style_results = search_domain("style", query, max_results=3)
    color_results = search_domain("color", query, max_results=3)
    typography_results = search_domain("typography", query, max_results=3)
    
    design_system = {
        "project_name": project_name or "Untitled Project",
        "query": query,
        "product": product_results[0] if product_results else None,
        "styles": style_results,
        "colors": color_results,
        "typography": typography_results,
    }
    
    # Display results
    if product_results:
        print("\n📦 PRODUCT TYPE RECOMMENDATION")
        print("-" * 40)
        for i, result in enumerate(product_results, 1):
            name = result.get('Product Type', result.get('product_type', 'N/A'))
            print(f"\n{i}. {name}")
            primary_style = result.get('Primary Style Recommendation', result.get('primary_style', 'N/A'))
            print(f"   Primary Style: {primary_style}")
            secondary = result.get('Secondary Styles', result.get('secondary_styles', 'N/A'))
            print(f"   Secondary: {secondary}")
            colors = result.get('Color Palette Focus', result.get('color_palette', 'N/A'))
            print(f"   Colors: {colors}")
            considerations = result.get('Key Considerations', result.get('considerations', 'N/A'))
            if considerations:
                print(f"   Notes: {considerations}")
    
    if style_results:
        print("\n🎨 STYLE RECOMMENDATIONS")
        print("-" * 40)
        for i, result in enumerate(style_results, 1):
            name = result.get('Style Category', result.get('style_name', result.get('name', 'N/A')))
            print(f"\n{i}. {name}")
            css = result.get('CSS/Technical Keywords', result.get('css_keywords', 'N/A'))
            if css:
                print(f"   CSS: {css[:100]}..." if len(css) > 100 else f"   CSS: {css}")
            ai_prompt = result.get('AI Prompt Keywords', result.get('ai_prompt', 'N/A'))
            if ai_prompt:
                print(f"   AI Prompt: {ai_prompt[:80]}..." if len(ai_prompt) > 80 else f"   AI Prompt: {ai_prompt}")
    
    if color_results:
        print("\n🌈 COLOR PALETTES")
        print("-" * 40)
        for i, result in enumerate(color_results, 1):
            name = result.get('Product Type', result.get('palette_name', result.get('name', 'N/A')))
            print(f"\n{i}. {name}")
            primary = result.get('Primary', result.get('primary_color', 'N/A'))
            secondary = result.get('Secondary', result.get('secondary_color', 'N/A'))
            accent = result.get('Accent', result.get('accent_color', 'N/A'))
            print(f"   Primary: {primary}")
            print(f"   Secondary: {secondary}")
            print(f"   Accent: {accent}")
            notes = result.get('Notes', result.get('notes', result.get('use_cases', '')))
            if notes:
                print(f"   Notes: {notes[:80]}..." if len(notes) > 80 else f"   Notes: {notes}")
    
    if typography_results:
        print("\n📝 TYPOGRAPHY PAIRINGS")
        print("-" * 40)
        for i, result in enumerate(typography_results, 1):
            name = result.get('Pairing Name', result.get('pairing_name', result.get('name', 'N/A')))
            print(f"\n{i}. {name}")
            heading = result.get('Heading Font', result.get('heading_font', 'N/A'))
            body = result.get('Body Font', result.get('body_font', 'N/A'))
            if heading:
                print(f"   Headings: {heading}")
            if body:
                print(f"   Body: {body}")
            google_import = result.get('Google Fonts Import', result.get('google_fonts_import', ''))
            if google_import:
                print(f"   Import: {google_import[:80]}..." if len(google_import) > 80 else f"   Import: {google_import}")
    
    print(f"\n{'='*60}")
    print("Design system generation complete!")
    print(f"{'='*60}\n")
    
    return design_system


def search_stack(stack: str, query: str, max_results: int = 5) -> List[Dict]:
    """Search stack-specific guidelines."""
    stack_file = STACKS_DIR / f"{stack}.csv"
    
    if not stack_file.exists():
        print(f"Stack not found: {stack}")
        available = [f.stem for f in STACKS_DIR.glob("*.csv")]
        print(f"Available stacks: {', '.join(available)}")
        return []
    
    data = load_csv(stack_file)
    
    # Score and sort results
    scored_results = []
    for row in data:
        combined_text = " ".join(str(v) for v in row.values())
        score = search_keyword(combined_text, query)
        
        if score > 0:
            scored_results.append((score, row))
    
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    return [row for score, row in scored_results[:max_results]]


def main():
    parser = argparse.ArgumentParser(
        description="UI/UX Pro Max Search - Design Intelligence Toolkit",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        "query",
        nargs="?",
        default=None,
        help="Search query (e.g., 'beauty spa wellness', 'minimalism dark mode')"
    )
    
    parser.add_argument(
        "--domain", "-d",
        choices=list(DOMAIN_FILES.keys()),
        help="Search within a specific domain"
    )
    
    parser.add_argument(
        "--design-system", "-ds",
        action="store_true",
        help="Generate complete design system (searches multiple domains)"
    )
    
    parser.add_argument(
        "--stack", "-s",
        help="Search stack-specific guidelines (e.g., react-native, nextjs)"
    )
    
    parser.add_argument(
        "--max-results", "-n",
        type=int,
        default=5,
        help="Maximum number of results (default: 5)"
    )
    
    parser.add_argument(
        "--project-name", "-p",
        help="Project name for design system generation"
    )
    
    parser.add_argument(
        "--list-domains",
        action="store_true",
        help="List available domains"
    )
    
    parser.add_argument(
        "--list-stacks",
        action="store_true",
        help="List available stacks"
    )
    
    args = parser.parse_args()
    
    # Require query for non-list commands
    if not args.query and not args.list_domains and not args.list_stacks:
        parser.print_help()
        return
    
    # Handle list commands
    if args.list_domains:
        print("Available domains:")
        for domain in DOMAIN_FILES.keys():
            print(f"  - {domain}")
        return
    
    if args.list_stacks:
        if STACKS_DIR.exists():
            stacks = [f.stem for f in STACKS_DIR.glob("*.csv")]
            print("Available stacks:")
            for stack in stacks:
                print(f"  - {stack}")
        else:
            print("Stacks directory not found")
        return
    
    # Design system generation
    if args.design_system:
        generate_design_system(args.query, args.project_name)
        return
    
    # Stack-specific search
    if args.stack:
        results = search_stack(args.stack, args.query, args.max_results)
        if results:
            print(f"\nStack: {args.stack}")
            print(f"Query: {args.query}")
            print(f"Results: {len(results)}\n")
            for i, row in enumerate(results, 1):
                print(f"{i}. {row}")
        return
    
    # Domain-specific search
    if args.domain:
        results = search_domain(args.domain, args.query, args.max_results)
        if results:
            print(f"\nDomain: {args.domain}")
            print(f"Query: {args.query}")
            print(f"Results: {len(results)}\n")
            for i, row in enumerate(results, 1):
                print(f"{i}. {row}")
        else:
            print("No results found")
        return
    
    # Default: show help
    parser.print_help()


if __name__ == "__main__":
    main()
