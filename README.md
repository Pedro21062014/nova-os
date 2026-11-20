# Nova IPTV 1.0.2

App para Android TV e uma prévia web da mesma interface. Interface em português com navegação por setas, Enter, Esc e `/` (busca), favoritos locais, detalhes, filtros e player HLS/MP4 e prévia em quadro fixo 16:9, que se adapta à janela. A reprodução de TV direta abre em tela cheia (ou ocupa o quadro em ambientes que bloqueiam fullscreen), sem X ou barra própria de controle. Esc/Voltar ou toque no canto superior direito retornam à lista. Os controles de players incorporados pertencem às emissoras. A interface, o logo fornecido, as capas e o catálogo abrem offline; a reprodução precisa de internet. Canais sem sinal direto verificado abrem a fonte oficial. Não há grade EPG fabricada; consulte a programação na página da emissora.

## Android TV

Android 6.0 ou superior (`br.com.novaos.iptv`). Instale o APK da release `nova-iptv-v1.0.2` ou da ficha atualizada na Nova Store e abra pelo launcher. Use as setas, OK e Voltar; fontes externas abrem no navegador quando disponível. O player Android tenta HLS nativo e pode recorrer ao player web. O ícone preto foi fornecido para identificação no sistema; o logo interno não mudou. A interface foi verificada em simulação, sem teste em TV física.

Para compilar: JDK 11+, Android SDK Platform 35 e Build Tools 35.0.1. Use `ANDROID_SDK_ROOT=/caminho/do/sdk ./android/scripts/build-apk.sh`. Para atualizações, mantenha a mesma assinatura; as variáveis `NOVA_KEYSTORE`, `NOVA_KEY_ALIAS`, `NOVA_KEYSTORE_PASS` e `NOVA_KEY_PASS` são privadas.

## Entregáveis
- `Nova-IPTV-V2.html` (prévia autônoma, no diretório pai).
- `Nova-IPTV-lista.m3u` (35 endereços: 14 canais HLS, 13 filmes, 8 episódios; importável em VLC ou player M3U compatível).
- `catalogo.json` (29 canais, sendo 14 HLS, 2 players oficiais incorporados e 13 fontes acessíveis pela plataforma oficial; 13 filmes e 3 séries com 8 episódios; créditos e URLs).

`sources/curate.py` extrai itens de um snapshot do iptv-org e de uma release de vídeos do GitHub, com seleção explícita de fontes e licenças. A lista aponta para as fontes; não hospeda, reempacota nem faz proxy dos vídeos. HLS validado por manifesto e acesso de segmento; arquivos VOD validados por assinatura inicial. Teste completo de início de reprodução em Chromium para Sintel, TV Brasil, TV UFOP, Cultura Fast, Record News, TV Gazeta, REDEVIDA, TV Aparecida, SBT Interior (SP), Record MT, TV Aratu, Catve, Caminandes E02 e Pepper & Carrot E04. Não certifica todos os dispositivos nem disponibilidade futura. O documentário *The Internet’s Own Boy* usa CC BY-NC-SA 4.0 (não comercial). Os 29 logotipos reais são embutidos na prévia; a origem de cada imagem consta em `assets/channels/sources.json`.

```sh
python -m pip install requests beautifulsoup4 pillow
python sources/curate.py
python sources/logos.py
python build-preview.py /home/user/Nova-IPTV-V2.html
NODE_PATH=/tmp/nova-test/node_modules node tests/v2.cjs /home/user/Nova-IPTV-V2.html
```

Teste de rede: servir o arquivo compilado como `index.html` (diretório `preview-public` nesta sessão) e rodar `NOVA_IPTV_URL=http://127.0.0.1:8102/ NODE_PATH=/tmp/nova-test/node_modules node tests/playback.cjs`. O HLS.js 1.6.15 está embutido com a licença. No ao vivo, o HLS.js é preferido quando compatível; demais navegadores podem usar HLS nativo. Sites oficiais e suas exigências de login, região ou programação são indicados no catálogo, fora do player ao vivo.

SBT Interior (SP) é um sinal regional que a JMVStream publica em player aberto; não substitui o SBT nacional nem é apresentado como o sinal do Vale do Paraíba. TV Aparecida: a entrada está no índice público e foi conferida no CDN que atende a emissora; o feed de referência exposto pela JMVStream na página de demonstração é de Rádio Aparecida, não a TV, e não foi usado. O catálogo registra a procedência e as alternativas oficiais para os sinais que precisam abrir fora da Nova.

A revisão do índice iptv-org confirmou, por imagem no navegador e pelo sinal publicado pelo Grupo Gazeta, que dois candidatos da Record apontavam para a mesma afiliada de Cuiabá. O catálogo inclui somente um deles como Record MT · TV Vila Real; Record nacional continua no RecordPlus. A TV Aratu usa o feed divulgado pelo parceiro JMVStream. O sinal Catve é o que consta na página oficial da emissora.

## Expansão do catálogo gratuito (prévia)

A prévia ampliada combina `catalogo.json` (base) e `catalogo-gratis.json` (seleção de fontes oficiais), totalizando 30 filmes, 26 séries e os mesmos 29 canais. As capas são incluídas em WebP, sem embutir vídeos. Os títulos novos abrem o Itaú Cultural Play (cadastro gratuito) ou publicações oficiais no YouTube (podem exibir anúncios). A disponibilidade pode mudar por país ou por prazo. Use **Séries → Infantis** para encontrar Turma da Mônica, Pocoyo, Bluey e outros desenhos; os novos itens desse grupo têm áudio em português. Alguns outros episódios no YouTube têm áudio em inglês; o idioma aparece na ficha. Os novos links externos não são entradas M3U: a lista tem 35 fontes diretas (o curta removido também saiu do M3U).

Para reconstruir apenas a interface, use a seleção já registrada. `sources/free_catalog.py` refaz a consulta pública de fichas e valida os canais do YouTube via oEmbed; não baixa vídeo nem reutiliza links temporários de player. As páginas novas não foram testadas com login e a versão 1.0.2 já inclui essa seleção como base offline.

```sh
python build-preview.py /home/user/Nova-IPTV-previa.html
NODE_PATH=/tmp/nova-test/node_modules node tests/free-catalog.cjs /home/user/Nova-IPTV-previa.html
```

## Catálogo automático, a partir da 1.0.2

O APK consulta o JSON `feed/catalogo-v1.json` da branch `nova-iptv-app` deste repositório ao abrir ou voltar ao primeiro plano. Salva a última versão válida; sem ela, usa o catálogo inicial incluído no APK. A sincronização não toca nos favoritos e não troca uma ficha ou reprodução que já esteja aberta. O GitHub fornece apenas dados e imagens; o player e o código da interface permanecem locais. A playlist M3U e a rota nativa HLS usam a revisão exibida.

Para mudar o destaque, altere o ID e os textos em `destaque.json`. Atualize os títulos, canais e capas nas fontes do projeto e execute `python3 sources/feed_data.py`. Publique o JSON gerado na branch `nova-iptv-app`. Nenhuma versão nova do APK é necessária para alterar o catálogo; versões anteriores à 1.0.2 precisam fazer a instalação inicial uma vez. Em **Fontes e licenças** o app mostra a versão instalada e se está usando GitHub, cache ou a base incluída.
