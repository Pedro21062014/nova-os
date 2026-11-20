# Nova OS 1.2.3

Launcher em português para Android TV e TV boxes. É um aplicativo de tela inicial, não uma ROM. O pacote Android gerencia aplicativos instalados, controle remoto, rede e o atualizador; a interface é local, renderizada pelo Android System WebView.

## Instalar e usar

1. Transfira o APK para a TV box, abra em um gerenciador de arquivos e, se necessário, permita a instalação por esse app. Desative a permissão depois de usar.
2. Abra o **Nova OS**. Use as setas para navegar; na barra superior, o foco já ativa a aba. Segure **OK** em um app fixado para organizá-lo.
3. Para escolher o Nova OS como tela inicial, vá em **Configurações → Sistema → Launcher padrão**. Alguns firmwares não permitem trocar o launcher; nesse caso, abra o Nova OS como app. Para desfazer a escolha, volte aos ajustes de tela inicial no Android.

Requisitos: Android **6.0/API 23 ou superior** e Android System WebView. A edição 1.1.2 inclui JS compatível com sintaxe antiga e substitutos para Grid, proporções, tipografia variável e vidro no Chromium 52, mantendo o layout e os recursos. Em WebViews sem `backdrop-filter`, o desfoque é reproduzido por uma amostra local da paisagem, não pelo compositor nativo. Há uma tela de recuperação se a interface não iniciar. A edição 1.1.3 usa renderização por software na tela Android para contornar falhas de drivers EGL em TV boxes; preserva o vidro com amostras locais. A edição 1.1.4 mantém a janela por software, elimina a camada de bitmap redundante, processa menos eventos do controle e carrega capas online em uma fila separada. A edição 1.2.1 carrega os ícones e as capas próximos da área visível também em WebViews legados, atualiza só a grade de apps quando a lista muda no Início e transmite capas do cache sem copiar o arquivo inteiro para um array. Atualize o WebView se o firmware permitir. Para substituir uma instalação existente, os dois APKs precisam ter a mesma assinatura. A edição fornecida para teste usa a mesma chave de teste da edição 1.0.0. A chave privada dessa edição não acompanha o pacote nem o código-fonte. Para distribuir versões sob seu controle, comece com uma chave própria; mudar de chave a partir da edição de teste exige reinstalação.

## Interface e conteúdo

- Tela 16:9 com tema claro nos controles selecionados, efeito de vidro opcional, rodízio de fotografias do Unsplash ao abrir e a cada 15 minutos, e modo descanso após 4 minutos sem interação. Uma tecla ou toque restaura a interface sem executar a ação do botão. As quatro paisagens já vêm no APK e giram mesmo offline.
- Filmes e séries em cartazes verticais 2:3, banners 16:9 no Início, favoritos reordenáveis, busca, lista de títulos e atalhos de transmissão. A aba **Ao vivo** indexa apps instalados compatíveis por nome; não é uma lista IPTV.
- Filmes: seleção editorial com 16 filmes do Prime Video Brasil que abrem o título no streaming, além do feed regional da iTunes Store Brasil; séries: TVmaze (CC BY-SA). Não são necessárias chaves de API. Em Filmes, filtre por origem e use **Mostrar mais filmes** para ver os próximos cartazes sem carregar tudo de uma vez. A disponibilidade do streaming depende da sua conta e região. Consulte [o catálogo Prime](docs/PRIME-CATALOG.md) para a origem dos links e artes. Os links de detalhe abrem fora do launcher. Não há reprodução integrada nem acesso ao histórico de serviços de streaming.
- Consulte [docs/ASSETS.md](docs/ASSETS.md) para fontes e licenças. As fotos do Unsplash constam em `app/src/main/assets/wallpapers/list.json`, com créditos no modo ambiente. A tipografia Manrope usa [SIL OFL](licenses/Manrope-OFL.txt).

## Atualizador dentro do app

1. Abra **Configurações → Sistema → Atualizações**. O canal oficial `Pedro21062014/nova-os` é fixo na edição distribuída. A partir da 1.2.7, repositórios personalizados de versões anteriores são descartados; as opções de verificação e download automáticos permanecem.
2. Com **Verificar automaticamente** ligado, o app consulta a origem ao abrir ou voltar ao primeiro plano, respeitando um intervalo de 12 horas após uma consulta bem-sucedida, ou a cada 12 horas enquanto aberto. Também é possível consultar manualmente. Não há serviço que fique rodando fora do launcher.
3. Uma versão nova aparece no painel. Use **Baixar atualização** ou ative **Baixar automaticamente**. Em seguida, escolha **Instalar atualização** e confirme no instalador do Android. Em Android 8+, o sistema pode pedir permissão de instalação para o Nova OS. Não há instalação silenciosa.

A origem é o endpoint público GitHub Releases `releases/latest`, sem token. O atualizador consulta **Releases**, não os commits de `main`. Use uma release estável com tag como `v1.2.0` e um asset `Nova-OS-1.2.0.apk` (também aceitos `Nova-OS.apk` e `Nova-OS-1.2.0-debug.apk`). O aplicativo exige versão superior, mesmo `applicationId`, mesmo certificado de assinatura, tamanho compatível e SHA-256 correspondente ao digest fornecido pelo GitHub. O instalador Android também verifica o pacote. Não publique chaves ou tokens.

## Compilar

Com JDK 11+ (o CI usa 17), Android SDK Platform 35, Build Tools 35.0.1 e `zip` disponíveis:

```bash
sdkmanager 'platforms;android-35' 'build-tools;35.0.1'
export ANDROID_SDK_ROOT=/caminho/do/android-sdk
./scripts/build-apk.sh
adb install -r artifacts/Nova-OS-1.2.1-debug.apk
```

A chave de teste fica em `~/.android/debug.keystore` por padrão. Para compilar com uma chave própria, defina `NOVA_KEYSTORE`, `NOVA_KEY_ALIAS` e `NOVA_KEYSTORE_PASS`; se a senha da chave for diferente, defina `NOVA_KEY_PASS`. Mantenha esses valores fora do Git. O script alinha, assina e verifica a saída. O APK utiliza os assets gerados já incluídos no repositório; após editar `ui/app.js` ou `ui/style.css`, regenere-os com `npm ci && npm run build:ui` (Node 20+).

### Publicação de releases

Há um workflow de APK de teste e outro de publicação assinada. Para a publicação, configure no seu repositório os secrets `NOVA_KEYSTORE_B64`, `NOVA_KEY_ALIAS`, `NOVA_KEYSTORE_PASS` e, se necessário, `NOVA_KEY_PASS`. A cada release, incremente `versionCode` e `versionName` no manifesto e mantenha a constante `VERSION` em `ui/app.js` em sincronia; execute `npm ci && npm run build:ui` e inclua os arquivos gerados no commit. Crie uma tag estável correspondente à versão, por exemplo `v1.2.0`.

Para criar o repositório, autentique a CLI com `gh auth login`, inicialize o Git caso esteja usando o ZIP (sem histórico) e publique usando `gh repo create nova-os --public --source=. --remote=origin --push`. Um repositório público é necessário para o atualizador sem credenciais. Também é possível publicar manualmente o APK em uma release estável assinada com sua própria chave.

## Prévia e testes

```bash
python3 scripts/preview.py --port 8080
```

Abra `http://localhost:8080`. A prévia usa os arquivos visuais do APK, mas não tem acesso aos apps do dispositivo nem ao instalador do Android. Para testes web opcionais:

```bash
npm install --prefix /tmp/nova-preview-test playwright-core
NODE_PATH=/tmp/nova-preview-test/node_modules node scripts/test-preview.cjs
NODE_PATH=/tmp/nova-preview-test/node_modules node scripts/test-perf.cjs
```

Pode-se definir `CHROMIUM_BIN` ou `NOVA_PREVIEW_URL`. O teste web simula a ponte Android e não executa o instalador. Para validar o motor legado de fato, rode `node scripts/test-chromium52.cjs` (dependência `ws`) enquanto um Chromium 52 de teste está aberto com depuração remota local na porta 9224 e a prévia está na porta 8091. O arquivo `scripts/tests/UpdateRulesTest.java` testa as regras de versão e origem do atualizador. Teste os ajustes de launcher padrão, permissões e a instalação de uma release futura na TV box física antes de distribuir.

### Nova Store (Android TV)

A partir do Nova OS 1.2.2, o convite aparece uma única vez por instalação/dados do app, somente se a loja ainda não estiver instalada. Recusar, fechar ou usar Voltar não impede abrir **Configurações → Sistema → Nova Store** a qualquer momento. O atalho baixa e verifica o APK oficial da loja (versão, pacote, tamanho e SHA-256), oferece instalação com confirmação do Android e permite abrir a loja quando ela já estiver instalada. Não há download automático. Na versão 1.2.3, o botão de sacola imediatamente à esquerda da busca abre a loja se ela estiver instalada; caso contrário, mostra as opções de download e instalação.

A loja é um app independente desenvolvido na branch independente `nova-store-app`, que não contém o código nem o histórico do launcher; seu APK é distribuído na release separada `nova-store-v1.0.0` do repositório `Pedro21062014/nova-os`, que não deve ser marcada como Latest. Antes de distribuir o launcher, confirme que o link público da loja disponibiliza exatamente o binário com o hash fixado em `StoreInstaller.java`.
