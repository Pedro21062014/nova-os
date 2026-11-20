# Nova Store · catálogo Android TV

Desde a Nova Store 1.0.1, a loja consulta um arquivo JSON público do GitHub ao abrir e ao voltar ao app (com intervalo mínimo de cinco minutos):

- [Editar o catálogo na branch nova-store-app](https://github.com/Pedro21062014/nova-os/blob/nova-store-app/catalogo.json)
- [Ler o arquivo Raw](https://raw.githubusercontent.com/Pedro21062014/nova-os/refs/heads/nova-store-app/catalogo.json)

## Atualizar sem compilar o APK

1. Edite **somente `catalogo.json`** na raiz da branch `nova-store-app`. Use um objeto existente de `apps` como exemplo. O campo `id` precisa ser único. Mantenha `schema: 1`; não há número de revisão para atualizar manualmente.
2. Cada app guarda nome, descrição, categoria, preço, logo, pelo menos duas capturas, suas fontes em `mediaSources` e uma lista `apks` com versões, URLs HTTPS, pacotes, tamanhos, Android mínimo e arquiteturas. Os registros iniciais também guardam hash e certificado, além da indicação de suporte a Android TV. Guarde URLs de download direto do desenvolvedor; a loja não hospeda os APKs de terceiros. A presença no JSON não substitui conferir a origem, a assinatura e a compatibilidade do binário.
3. Para trocar um logo ou captura, exporte em WebP e rode `python3 loja/empacotar-imagem.py sua-imagem.webp`. Cole o valor gerado, com aspas, em `logo` ou em `shots`. Assim as imagens **estão dentro do JSON**, não só referenciadas por links. `mediaSources` conserva a procedência. Mantenha o arquivo inteiro abaixo de 12 MiB e cada imagem em até 350.000 caracteres codificados. Prefira compactar capturas com até ~840 px de largura e ícones com até ~150 px.
4. Para destacar um app, use seu ID em `featured`, `wellKnown` ou `essentials`. Se remover um app, remova também as referências nessas listas. As categorias aceitas são `video`, `live`, `music`, `files`, `photo`, `net`, `game`, `personal` e `tool`.
5. `officialApps` é a exceção para o YouTube de Android TV, sem APK direto. Mantenha-o separado de `apps`, `featured`, `wellKnown` e `essentials` para os leitores 1.0.1 continuarem aceitando o RAW.
6. Faça commit do JSON. A Nova Store instalada sincroniza na próxima abertura ou retomada elegível, sujeito ao cache do GitHub. Não publique APK novo para mudar o catálogo.

A edição Android conserva o último arquivo válido no aparelho, mesmo após reiniciar. Em caso de erro, falta de internet ou JSON inválido, mantém o cache; se nunca sincronizou, mostra a cópia que acompanha o APK. O HTML também traz a cópia inicial e tenta carregar o RAW quando o navegador permite conexão.

## Prévia independente

```bash
python3 loja/build-preview.py
python3 -m http.server 8080 --bind 0.0.0.0 --directory loja
```

Use as setas, Enter (OK), Esc e `/` para buscar. Cada app tem página própria (ex.: `#app/jellyfin`) e galeria com setas. Os APKs são baixados dos endereços oficiais; o Android decide a instalação e pede confirmação.

O APK Android leva as imagens da cópia local como WebPs separados; o HTML de prévia continua autônomo. O RAW é o mesmo para os dois formatos. No Android, a camada nativa valida o RAW e entrega à interface JSON compacto e mídia por demanda.
