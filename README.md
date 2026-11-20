# Nova IPTV 1.0.0

App para Android TV e uma prévia web da mesma interface. Interface em português com navegação por setas, Enter, Esc e `/` (busca), favoritos locais, detalhes, filtros e player HLS/MP4 e prévia em quadro fixo 16:9, que se adapta à janela. A reprodução de TV direta abre em tela cheia (ou ocupa o quadro em ambientes que bloqueiam fullscreen), sem X ou barra própria de controle. Esc/Voltar ou toque no canto superior direito retornam à lista. Os controles de players incorporados pertencem às emissoras. A interface, o logo fornecido, as capas e o catálogo abrem offline; a reprodução precisa de internet. Canais sem sinal direto verificado abrem a fonte oficial. Não há grade EPG fabricada; consulte a programação na página da emissora.

## Android TV

Android 6.0 ou superior (`br.com.novaos.iptv`). Instale o APK da release `nova-iptv-v1.0.0` e abra pelo launcher. Use as setas, OK e Voltar; fontes externas abrem no navegador quando disponível. O player Android tenta HLS nativo e pode recorrer ao player web. O ícone preto foi fornecido para identificação no sistema; o logo interno não mudou. A interface foi verificada em simulação, sem teste em TV física.

Para compilar: JDK 11+, Android SDK Platform 35 e Build Tools 35.0.1. Use `ANDROID_SDK_ROOT=/caminho/do/sdk ./android/scripts/build-apk.sh`. Para atualizações, mantenha a mesma assinatura; as variáveis `NOVA_KEYSTORE`, `NOVA_KEY_ALIAS`, `NOVA_KEYSTORE_PASS` e `NOVA_KEY_PASS` são privadas.

## Entregáveis
- `Nova-IPTV-V2.html` (prévia autônoma, no diretório pai).
- `Nova-IPTV-lista.m3u` (36 endereços: 14 canais HLS, 14 filmes, 8 episódios; importável em VLC ou player M3U compatível).
- `catalogo.json` (29 canais, sendo 14 HLS, 2 players oficiais incorporados e 13 fontes acessíveis pela plataforma oficial; 14 filmes e 3 séries com 8 episódios; créditos e URLs).

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
