#!/usr/bin/env python3
"""
Substack RSS Fetcher & Article Extractor
Designed for @RahulShips Content Co-pilot.

Fetches the RSS feeds of specified Substack newsletter URLs and extracts 
the titles of the latest 5 articles from each for easy content review.

Usage:
  python substack_rss.py [url1] [url2] ...
  
If no URLs are provided, the script runs interactively or analyzes default top newsletters.
"""

import sys
import urllib.request
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

# ANSI Terminal Styling Helper
def style(color_code, text, bold=False):
    """Formats text with ANSI color codes if output is a terminal."""
    if sys.stdout.isatty():
        b = "\033[1m" if bold else ""
        return f"\033[{color_code}m{b}{text}\033[0m"
    return text

CYAN = "36"
GREEN = "32"
YELLOW = "33"
BLUE = "34"
RED = "31"
MAGENTA = "35"
WHITE = "37"

def normalize_substack_rss_url(url: str) -> str:
    """
    Transforms a Substack newsletter homepage or article URL into its RSS feed URL.
    Examples:
      - 'https://pragmaticengineer.substack.com/p/some-article' -> 'https://pragmaticengineer.substack.com/feed'
      - 'vibe-coding.substack.com' -> 'https://vibe-coding.substack.com/feed'
    """
    url = url.strip()
    if not url:
        return ""
    
    # Prepend scheme if missing
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    parsed = urlparse(url)
    netloc = parsed.netloc
    
    if not netloc:
        return ""
        
    # Standard substack blog URL is netloc/feed
    rss_url = f"https://{netloc}/feed"
    return rss_url

def fetch_rss_feed_titles(url: str, limit: int = 5) -> dict:
    """
    Fetches rss feed, parses XML and returns dictionary with newsletter title and top N articles.
    """
    rss_url = normalize_substack_rss_url(url)
    if not rss_url:
        return {"success": False, "error": "Invalid URL format", "url": url}

    # Set up user-agent to bypass potential Cloudflare or basic bot blocks
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
    }
    
    try:
        req = urllib.request.Request(rss_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        channel = root.find("channel")
        if channel is None:
            return {"success": False, "error": "Invalid RSS XML format (missing <channel>)", "url": url, "rss_url": rss_url}
            
        newsletter_title = channel.findtext("title", default="Substack Newsletter").strip()
        newsletter_desc = channel.findtext("description", default="").strip()
        
        items = channel.findall("item")
        articles = []
        for item in items[:limit]:
            title = item.findtext("title", default="Untitled post").strip()
            link = item.findtext("link", default="").strip()
            pub_date = item.findtext("pubDate", default="").strip()
            # Clean pubDate display format (e.g., 'Wed, 24 May 2026 12:00:00 GMT' -> '24 May 2026')
            if pub_date and len(pub_date) > 16:
                pub_date = " ".join(pub_date.split()[1:4])
            articles.append({"title": title, "link": link, "date": pub_date})
            
        return {
            "success": True, 
            "title": newsletter_title, 
            "description": newsletter_desc,
            "articles": articles, 
            "url": url, 
            "rss_url": rss_url
        }
        
    except urllib.error.HTTPError as e:
        return {"success": False, "error": f"HTTP {e.code} ({e.reason})", "url": url, "rss_url": rss_url}
    except urllib.error.URLError as e:
        return {"success": False, "error": f"Network error ({e.reason})", "url": url, "rss_url": rss_url}
    except ET.ParseError:
        return {"success": False, "error": "Failed to parse XML payload. Is this a Substack URL?", "url": url, "rss_url": rss_url}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}", "url": url, "rss_url": rss_url}

def main():
    print(style(CYAN, "======================================================", bold=True))
    print(style(CYAN, "  @RAHULSHIPS SUBSTACK RSS INTEGRATOR & CHRONICLES  ", bold=True))
    print(style(CYAN, "======================================================", bold=True))
    
    # Identify target URLs
    urls = sys.argv[1:]
    
    if not urls:
        print(style(WHITE, "No URLs specified. Running in interactive walkthrough mode."))
        print(style(YELLOW, "Entering default standard creators list for preview...", bold=True))
        
        # Default active newsletters
        urls = [
            "https://pragmaticengineer.substack.com",
            "https://read.readme.one",
            "https://drgregory.substack.com"
        ]
        
    print(f"Analyzing {style(GREEN, len(urls))} newsletters...")
    print("-" * 54)
    
    for idx, url in enumerate(urls, 1):
        print(f"\n[{idx}/{len(urls)}] Fetching: {style(BLUE, url)}")
        result = fetch_rss_feed_titles(url, limit=5)
        
        if result["success"]:
            print(f"✦ Source: {style(GREEN, result['title'], bold=True)}")
            if result.get("description"):
                print(f"  Bio: {style(WHITE, result['description'])}")
            print(f"  RSS Feed: {result['rss_url']}")
            print(style(WHITE, "  Latest Articles:", bold=True))
            
            for index, item in enumerate(result["articles"], 1):
                date_str = f" [{item['date']}]" if item['date'] else ""
                print(f"    {index}. {style(CYAN, item['title'])} {style(YELLOW, date_str)}")
        else:
            print(f"⚠ {style(RED, 'Failed to fetch content:')} {result['error']}")
            print(f"  Attempted Feed Endpoint: {result.get('rss_url', 'None')}")
            
    print("\n" + style(CYAN, "======================================================", bold=True))
    print(style(GREEN, "  CRAWLING COMPLETED. READY FOR BRIEF CURATION.      ", bold=True))
    print(style(CYAN, "======================================================", bold=True))

if __name__ == "__main__":
    main()
