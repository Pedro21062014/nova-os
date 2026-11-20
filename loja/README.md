# Nova Store · catálogo Android TV

Projeto web independente na branch `nova-store`. Todos os apps listados oferecem download direto de seus APKs oficiais. A Nova Store não reempacota, hospeda nem instala os arquivos. Nenhum código do launcher é alterado.

## Testar a loja

```bash
python3 loja/build-preview.py
python3 -m http.server 8080 --bind 0.0.0.0 --directory loja
```

O HTML gerado abre offline; baixar exige internet e um navegador que permita downloads. Use as setas para navegar, Enter (OK) para selecionar, Esc para voltar e `/` para buscar. **Minha lista** fica no navegador quando há armazenamento local. Cada app tem página própria acessível por `#app/{id}`, como `#app/jellyfin`. Cada app tem um carrossel com duas ou mais capturas. Use os botões anterior/próxima ou as setas esquerda/direita do controle quando o foco estiver na galeria. Clique na imagem para ampliar; as setas funcionam também na tela ampliada. A seção **APKs oficiais** oferece nove categorias, busca por nome ou função, ordem por nome/adições e filtro pela arquitetura do sistema. A lista abre em lotes de 15. Apps em desenvolvimento têm selo **Prévia**.

## Conteúdo e verificações

- `apk-catalog.json`: 68 apps e 87 arquivos APK. Registra a fonte oficial, o arquivo específico, versão, bytes, Android mínimo, arquiteturas observadas, pacote, SHA-256 e certificado. Os 87 arquivos foram baixados e conferidos com `aapt` e `apksigner`; o hash publicado foi comparado quando disponível. Os links de Steam Link, FCast, NordVPN, Surfshark, TiviMate e HDHomeRun são canais oficiais mantidos pelos desenvolvedores: os metadados correspondem ao arquivo observado e podem mudar se o fornecedor atualizar o link. Nenhuma instalação foi testada em TV física.
- `apps-expansion.json`: nomes, categorias, descrições e selo de prévia dos apps incluídos na expansão.
- `media-sources.json`: procedência de cada logo e captura publicada pelo respectivo projeto. As imagens são incorporadas localmente em WebP e podem vir de versões ou plataformas diferentes da que está disponível para download; as páginas com material promocional ou capturas de outros dispositivos da nova seleção trazem uma indicação. A arte do destaque de VLC é ilustrativa; o ícone e as capturas da página do app são oficiais. Os logotipos são marcas dos respectivos proprietários. A fonte Manrope mantém a licença já incluída no repositório.
- O instalador Android exige confirmação. Uma edição previamente instalada com outra assinatura pode não aceitar a atualização por cima. Uma assinatura válida não é uma garantia sobre o comportamento do aplicativo.
