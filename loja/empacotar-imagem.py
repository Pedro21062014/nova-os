#!/usr/bin/env python3
"""Print the self-contained value for a logo or screenshot in catalogo.json."""
import base64
from pathlib import Path
import sys

if len(sys.argv) != 2:
    sys.exit('Uso: python3 loja/empacotar-imagem.py imagem.webp')
data = Path(sys.argv[1]).read_bytes()
if len(data) < 12 or data[:4] != b'RIFF' or data[8:12] != b'WEBP':
    sys.exit('O arquivo precisa ser uma imagem WebP.')
uri = 'data:image/webp;base64,' + base64.b64encode(data).decode('ascii')
if len(uri) > 350_000:
    sys.exit('Imagem grande demais. Exporte o WebP em resolução ou qualidade menor.')
print('"' + uri + '"')
