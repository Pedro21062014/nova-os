# Nova OS

Launcher em português para Android TV e TV boxes. É um app de tela inicial, **não** uma ROM ou substituto do Android. A camada Android gerencia apps, intents, controle remoto e rede; a interface é empacotada e renderizada pelo Android System WebView, sem servidor, framework JavaScript, conta ou chave de API.

## Instalar

1. Transfira `Nova-OS-1.0.0-debug.apk` para a TV box e abra-o em um gerenciador de arquivos confiável. Se o sistema solicitar, permita a instalação por aquele app e revogue a permissão depois.
2. Abra o **Nova OS**. Use as setas para navegar, **OK** para selecionar e **Voltar** para fechar a tela. Na tela inicial, segure **OK** em um favorito para organizá-lo.
3. Para usar como tela inicial, abra **Configurações → Launcher padrão**, ou procure **App de início** nos ajustes do Android. Alguns firmwares não permitem trocar a tela inicial; nesse caso, use o Nova OS como app. Para desfazer a escolha, volte aos ajustes do Android e selecione o launcher anterior.

Requer Android 6.0 (API 23) ou posterior e uma versão atualizada do Android System WebView compatível com o aparelho. O APK é assinado para teste; use uma chave própria de release para distribuição e atualizações de produção. Um APK com assinatura diferente não pode atualizar diretamente esta instalação.

## O que está incluído

- Início com até sete favoritos reordenáveis, relógio, papel de parede e efeito de vidro opcional. O vidro usa transparência, sem desfoque em tempo real.
- Vitrine do início oculta, editorial ou com filmes em alta. Papel de parede, boas-vindas e pré-carregamento de filmes são configuráveis.
- Busca local entre apps e títulos carregados, catálogo de filmes e séries, detalhes, **Minha lista**, **Todos os apps**, **Organizar apps** e **Modo ambiente**.
- Aba **Ao vivo**: atalhos para aplicativos compatíveis encontrados no aparelho (por nome), não uma lista IPTV.
- Filmes: [feed regional da iTunes Store](https://itunes.apple.com/br/rss/topmovies/limit=12/json). Séries: [TVmaze](https://www.tvmaze.com/api) (dados CC BY-SA, podem vir em inglês). As consultas não precisam de credenciais. O app mantém até 12 itens por fonte, tenta atualizar depois de 6 horas, limita o cache de capas a 6 MiB e exibe seleção editorial quando o catálogo não estiver disponível.
- O app não reproduz filmes, não inclui canais próprios e não acessa históricos da Netflix ou de outros serviços. Os links são abertos externamente; podem exigir um app compatível, navegador ou assinatura, dependendo do título.
- Preferências, lista e metadados ficam no dispositivo. Imagens editoriais são ilustrativas. Manrope está sob [SIL OFL](licenses/Manrope-OFL.txt); marcas de terceiros pertencem a seus proprietários.

## Rodar a interface no navegador

```bash
python3 scripts/preview.py --port 8080
```

Abra `http://localhost:8080`. A prévia usa os mesmos arquivos visuais do APK e atalhos demonstrativos; não tem acesso aos aplicativos instalados nem às configurações do Android.

## Compilar o APK

Com JDK 11+ (CI usa 17), Android SDK Platform 35, Build Tools 35.0.1 e `zip` disponíveis:

```bash
sdkmanager 'platforms;android-35' 'build-tools;35.0.1'
export ANDROID_SDK_ROOT=/caminho/do/android-sdk
./scripts/build-apk.sh
adb install -r artifacts/Nova-OS-1.0.0-debug.apk
```

O script compila, alinha, assina e verifica o APK. A chave de teste fica localmente (`~/.android/debug.keystore` por padrão). O workflow GitHub Actions **Nova OS · APK** gera um artefato em cada push. A validação da prévia web não substitui o teste pelo controle remoto em hardware real.

## Publicar em um repositório novo

Na sua máquina, autentique a CLI com o fluxo oficial (`gh auth login`). Na pasta deste projeto, execute:

```bash
git init -b main
git add .
git commit -m "Nova OS 1.0.0"
gh repo create nova-os --private --source=. --remote=origin --push
```

Se já estiver trabalhando no repositório local inicializado, pule `git init`, `git add` e `git commit`. Use `--public` apenas se quiser disponibilizar o código publicamente. Não inclua tokens nem chaves de assinatura no repositório.

### Teste de interação (opcional)

Com a prévia rodando, Chromium disponível e `playwright-core` instalado para a sessão:

```bash
npm install --prefix /tmp/nova-preview-test playwright-core
NODE_PATH=/tmp/nova-preview-test/node_modules node scripts/test-preview.cjs
```

Para outro binário ou outra URL, defina `CHROMIUM_BIN` ou `NOVA_PREVIEW_URL`.
