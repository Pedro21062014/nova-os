#!/usr/bin/env python3
"""Local Nova OS design preview."""
import argparse
from collections import OrderedDict
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
from threading import Lock
from time import monotonic
from urllib.parse import parse_qs, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ASSETS = Path(__file__).resolve().parents[1] / 'app/src/main/assets'
SOURCES = {'/catalog/movies.json': 'https://itunes.apple.com/br/rss/topmovies/limit=12/json',
           '/catalog/series.json': 'https://api.tvmaze.com/shows?page=0'}
CACHE = OrderedDict()
CACHE_LOCK = Lock()

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

OPENER = build_opener(NoRedirect())

class Preview(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ASSETS), **kwargs)

    def log_message(self, fmt, *args):
        if len(args) > 1 and str(args[1]).startswith(('4', '5')) and '/favicon.ico' not in str(args[0]):
            super().log_message(fmt, *args)

    def respond(self, mime, data):
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'public, max-age=3600')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        route = urlsplit(self.path)
        url = SOURCES.get(route.path)
        is_art = route.path == '/art'
        if is_art:
            url = parse_qs(route.query).get('url', [''])[0]
            try:
                u = urlsplit(url)
                host = u.hostname or ''
                if (len(url) > 1024 or u.scheme != 'https' or u.port not in (None, 443) or
                        u.username is not None or not (host == 'static.tvmaze.com' or re.fullmatch(r'is[0-9]+-ssl\.mzstatic\.com', host))):
                    raise ValueError('Bad artwork URL')
            except ValueError:
                self.send_error(400)
                return
        if not url:
            if route.path != '/' and not re.fullmatch(r'/(index\.html|app\.js|style\.css|manrope\.woff2|wallpapers/(?:list\.json|(?:braies|moraine|reine|aoraki)\.webp)|img/(?:dolomitas|brand/(?:netflix|youtube|prime|hbo|spotify|apple|plex|nova-os-header)|media/(?:interstellar|severance|hunger|dune|interstellar-poster|severance-poster|hunger-poster|dune-poster))\.webp)', route.path):
                self.send_error(404)
                return
            return super().do_GET()
        try:
            now = monotonic()
            with CACHE_LOCK:
                entry = CACHE.get(url)
            if entry and now - entry[0] < 21600:
                return self.respond(entry[1], entry[2])
            with OPENER.open(Request(url, headers={'User-Agent': 'Nova OS Preview/1.0'}), timeout=5) as r:
                mime = r.headers.get_content_type() if is_art else 'application/json; charset=utf-8'
                if is_art and mime not in ('image/jpeg', 'image/png', 'image/webp'):
                    raise ValueError('Unsupported artwork')
                bound = (340 if is_art else 768) * 1024
                data = r.read(bound + 1)
                if len(data) > bound:
                    raise ValueError('Oversize')
                if route.path == '/catalog/series.json':
                    data = json.dumps(json.loads(data)[:12], ensure_ascii=False).encode()
            with CACHE_LOCK:
                CACHE[url] = (now, mime, data)
                CACHE.move_to_end(url)
                while len(CACHE) > 32:
                    CACHE.popitem(last=False)
            self.respond(mime, data)
        except (OSError, ValueError):
            try:
                self.send_error(502, 'Fonte externa indisponível')
            except OSError:
                pass

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prévia web do Nova OS')
    parser.add_argument('--port', type=int, default=8080)
    opts = parser.parse_args()
    server = ThreadingHTTPServer(('0.0.0.0', opts.port), Preview)
    print(f'Nova OS · Prévia de design · porta {opts.port}', flush=True)
    server.serve_forever()
