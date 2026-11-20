from pathlib import Path
from base64 import b64encode
import sys
import json
from urllib.parse import urlsplit

root = Path(__file__).resolve().parent

def asset(name, mime):
    return "data:" + mime + ";base64," + b64encode((root / "assets" / name).read_bytes()).decode("ascii")

css = (root / "store.css").read_text().replace("__HERO__", asset("hero.webp", "image/webp")).replace("__FONT__", asset("manrope.woff2", "font/woff2"))
js = (root / "store.js").read_text()
catalog = json.loads((root / "apk-catalog.json").read_text())
fields = ("app", "version", "abi", "url", "source", "minSdk", "bytes", "abis", "package")
allowed_downloads = {"github.com", "download.videolan.org", "mirrors.kodi.tv", "buildbot.libretro.com", "dl.strem.io", "media.steampowered.com", "raw.githubusercontent.com", "www.ppsspp.org", "dl.fcast.org", "dl.dolphin-emu.org", "downloads.scummvm.org", "downloads.nordcdn.com", "downloads.surfshark.com", "download.wireguard.com", "www.lonelycatgames.com", "files.tivimate.com", "download.silicondust.com", "global.synologydownload.com"}
for row in catalog:
    url = urlsplit(row["url"])
    xplore_direct = url.netloc == "www.lonelycatgames.com" and url.path == "/download/4-53-08" and url.query == "wpdmdl=3649"
    if url.scheme != "https" or url.netloc not in allowed_downloads or url.fragment or (not xplore_direct and (not url.path.endswith(".apk") or url.query)):
        raise ValueError(f"Origem de APK não permitida: {row['url']}")
    if url.netloc == "raw.githubusercontent.com" and not url.path.startswith("/MediaBrowser/Emby.Releases/"):
        raise ValueError("APK fora do repositório oficial de releases do Emby")
    if urlsplit(row["source"]).scheme != "https":
        raise ValueError("A fonte oficial deve usar HTTPS")
js = js.replace("/*CATALOG*/[]", json.dumps([{k: row[k] for k in fields} for row in catalog], ensure_ascii=False, separators=(",", ":")))
media = {}
for row in catalog:
    app = row["app"]
    if app in media:
        continue
    logo = asset(f"apps/{app}-logo.webp", "image/webp")
    shots = [asset(f"apps/{file.name}", "image/webp") for file in sorted((root / "assets/apps").glob(f"{app}-s*.webp"))]
    if len(shots) < 2:
        raise ValueError(f"Inclua ao menos duas capturas para {app}")
    media[app] = dict(logo=logo, shots=shots)
js = js.replace("/*MEDIA*/{}", json.dumps(media, separators=(",", ":")))
extra = json.loads((root / "apps-expansion.json").read_text())
if any(app["id"] not in media for app in extra):
    raise ValueError("App novo sem APK, logo ou captura")
js = js.replace("/*EXPANSION*/[]", json.dumps(extra, ensure_ascii=False, separators=(",", ":")))
html = (root / "page.html").read_text().replace("/*STYLE*/", css).replace("/*SCRIPT*/", js)
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "index.html"
out.write_text(html, encoding="utf-8")
print(out)
