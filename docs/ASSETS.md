# Nova OS — revisão visual para aprovação

Protótipo separado: não altera o APK nem o repositório do launcher. Para abrir: `python3 server.py --port 8081`.

## Marcas nesta prévia

- Netflix, Prime Video e Apple TV: ativos de marca disponibilizados pelo catálogo Plex (`provider-static.plex.tv/discover/logos/p/`, arquivos `netflix-icon.svg`, `amazon-prime-video.svg`, `apple-tv.svg`). As formas foram preservadas e as caixas de fundo foram removidas para o uso no launcher.
- Plex: marca extraída do SVG do cabeçalho de `www.plex.tv`.
- YouTube e HBO Max: marcas vetoriais via Wikimedia Commons (`YouTube full-color icon (2024).svg`, `HBO Max (2025).svg`; HBO Max em branco para fundo escuro).
- Spotify: marca via Simple Icons, com a cor verde da marca.
- Interestelar, Ruptura, Duna: Parte Dois e Jogos Vorazes: imagens de divulgação 16:9 do metadado `og:image` nas páginas brasileiras da Apple TV, redimensionadas para 800 × 450 e convertidas para WebP. Os destinos dessas páginas constam no JavaScript da prévia.

Marcas e imagens pertencem aos respectivos titulares. Antes da distribuição do APK, confirmar os direitos de uso aplicáveis aos ativos de terceiros. O wallpaper continua sendo a ilustração do projeto original.

Na revisão de moldura 2:3, os cartazes locais de Duna e Jogos Vorazes vieram dos catálogos regionais da Apple; o de Interestelar veio do CDN de imagens do TMDB (`gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`).

Marca do Nova OS no cabeçalho: PNG enviado pelo usuário, armazenado em `docs/nova-os-logo-original.png`. A interface carrega a versão WebP local `app/src/main/assets/img/brand/nova-os-header.webp`, recortada para remover a margem transparente e reduzida para uso em TV.

## Paisagens rotativas

As quatro fotografias são do Unsplash e estão identificadas por URL, fotógrafo e local no catálogo `app/src/main/assets/wallpapers/list.json`. As quatro fotos são distribuídas como WebP locais, com créditos no modo ambiente.

## Início expandido e Prime Video

- As imagens decorativas de categorias de `assets/img/discover/` foram geradas para a prévia do Nova OS.
- As capas editoriais de `assets/img/prime/` vieram das páginas de divulgação oficiais: [catálogo e fontes](PRIME-CATALOG.md).
