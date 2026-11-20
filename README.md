# Nova Store para Android TV

Aplicativo independente (`br.com.novaos.store`), com o catálogo web profissional empacotado como conteúdo local. Da versão 1.0.1 em diante, sincroniza o catálogo completo de `catalogo.json` no GitHub Raw e preserva uma cópia para uso offline. O APK escolhido é baixado pelo gerenciador do Android a partir do endereço oficial que consta no catálogo. O usuário confirma a instalação no Android. Em Android 6–9, use a notificação de download para abrir o arquivo se ele não estiver na pasta pública.

A loja tem ícone e banner de Android TV. Use as setas, OK e Voltar. Não exige o Nova OS para funcionar. A atividade não permite navegar em páginas remotas dentro do WebView; o botão de fonte abre o navegador externo.

## Build

Com Java 11, Android Platform 35 e Build Tools 35.0.1:

```bash
export ANDROID_SDK_ROOT=/caminho/do/sdk
NOVA_OUT="$PWD/Nova-Store-1.0.1.apk" ./store-android/scripts/build-apk.sh
```

O APK local é assinado com a chave de teste por padrão. Para publicar usando sua chave, forneça `NOVA_KEYSTORE`, `NOVA_KEY_ALIAS`, `NOVA_KEYSTORE_PASS` e, se diferente, `NOVA_KEY_PASS` via ambiente privado. Use a mesma chave nas atualizações. Não exponha o keystore.

Canal de distribuição separado: tags `nova-store-vX.Y.Z` na branch `nova-store-app`. **Não marcar como release mais recente**, para não interferir no atualizador do Nova OS. Não substitua o binário já publicado na tag `nova-store-v1.0.0`: o Nova OS 1.2.3 confere o hash do APK daquela versão. Para usar o catálogo sincronizado pela primeira vez, instale o APK 1.0.1 por cima da loja 1.0.0. Depois, o conteúdo se atualiza pelo Raw, sem reinstalar.

Veja [como editar o arquivo do catálogo](loja/README.md).
