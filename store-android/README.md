# Nova Store para Android TV

Aplicativo independente (`br.com.novaos.store`), com o catálogo web profissional empacotado como conteúdo local. Funciona offline para navegar; o APK escolhido é baixado pelo gerenciador do Android a partir do endereço oficial que consta no catálogo. O usuário confirma a instalação no Android. Em Android 6–9, use a notificação de download para abrir o arquivo se ele não estiver na pasta pública.

A loja tem ícone e banner de Android TV. Use as setas, OK e Voltar. Não exige o Nova OS para funcionar. A atividade não permite navegar em páginas remotas dentro do WebView; o botão de fonte abre o navegador externo.

## Build

Com Java 11, Android Platform 35 e Build Tools 35.0.1:

```bash
export ANDROID_SDK_ROOT=/caminho/do/sdk
NOVA_OUT="$PWD/Nova-Store-1.0.0.apk" ./store-android/scripts/build-apk.sh
```

O APK local é assinado com a chave de teste por padrão. Para publicar usando sua chave, forneça `NOVA_KEYSTORE`, `NOVA_KEY_ALIAS`, `NOVA_KEYSTORE_PASS` e, se diferente, `NOVA_KEY_PASS` via ambiente privado. Use a mesma chave nas atualizações. Não exponha o keystore.

Canal de distribuição separado: tag `nova-store-v1.0.0`, baseada na branch `nova-store-app`, com o arquivo `Nova-Store-1.0.0.apk`. **Não marcar como release mais recente**, para não interferir no atualizador do Nova OS. Não substitua o binário nessa tag: o launcher confere tamanho e SHA-256 antes de oferecê-lo ao instalador da TV.
