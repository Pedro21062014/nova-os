# Nova Store para Android TV

Aplicativo independente (`br.com.novaos.store`), com o catálogo web profissional empacotado como conteúdo local. Da versão 1.0.1 em diante, sincroniza o catálogo completo de `catalogo.json` no GitHub Raw e preserva uma cópia para uso offline. O gerenciador de downloads do Android fornece os bytes baixados e o tamanho total à interface. Se o total for desconhecido, a barra aparece sem porcentagem. Ao concluir, a loja disponibiliza **Instalar**, verifica pacote, assinatura e SHA-256 quando aplicável, e abre a confirmação do Android. Os links rolantes podem mudar de tamanho e hash; nesses casos, conserva-se a verificação do pacote e do certificado. Para o YouTube, a loja abre o app instalado ou encaminha ao Google Play; não oferece APK avulso. A página também leva ao SmartTube, alternativa independente com download direto.

A loja tem ícone e banner de Android TV. Use as setas, OK e Voltar. Não exige o Nova OS para funcionar. A atividade não permite navegar em páginas remotas dentro do WebView; o botão de fonte abre o navegador externo.

A versão 1.0.5 inclui a Nova IPTV em destaque. A ficha permite preparar o APK incluído, mesmo offline, e então abrir a confirmação de instalação do Android. Para assistir, é preciso internet.

## Build

Com Java 11, Android Platform 35 e Build Tools 35.0.1:

```bash
export ANDROID_SDK_ROOT=/caminho/do/sdk
NOVA_OUT="$PWD/Nova-Store-1.0.5.apk" ./store-android/scripts/build-apk.sh
```

No build padrão, o script obtém o APK publicado da Nova IPTV e confere o SHA-256; em builds offline, forneça o mesmo APK via `NOVA_IPTV_APK` (caminho absoluto).

O APK local é assinado com a chave de teste por padrão. Para publicar usando sua chave, forneça `NOVA_KEYSTORE`, `NOVA_KEY_ALIAS`, `NOVA_KEYSTORE_PASS` e, se diferente, `NOVA_KEY_PASS` via ambiente privado. Use a mesma chave nas atualizações. Não exponha o keystore.

## Publicar e ativar o aviso de atualização

1. Faça commit do código na branch independente `nova-store-app` e preserve todos os APKs já publicados. Use `nova-store-vX.Y.Z` com o asset `Nova-Store-X.Y.Z.apk`, assinado com a **mesma chave** das versões instaladas. Não marque a release da Store como `Latest`: esse canal pertence ao Nova OS.
2. Preencha `atualizacao.json` com `versionCode` crescente, `version`, URL do asset, tamanho em bytes e SHA-256 do APK assinado. Só avance a branch pública com esse descritor depois de confirmar que o asset da nova release está disponível e corresponde ao tamanho e hash. A tag pode apontar para o commit local até a publicação do descritor.
3. A Store 1.0.2 em diante consulta esse descritor quando abre ou volta ao primeiro plano. A partir da 1.0.4, **Verificar atualizações** no menu lateral consulta o canal imediatamente e informa o resultado. A loja oferece a atualização, mas não baixa sem confirmação. Antes da instalação, verifica o APK contra o hash, o pacote `br.com.novaos.store`, a versão anunciada e a assinatura da cópia instalada.

Se você estiver na Store 1.0.0 ou 1.0.1, instale a 1.0.2 por cima para receber os próximos avisos. Para alterações de apps e capturas, basta editar o [catálogo](loja/README.md).
