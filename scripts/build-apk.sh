#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
BT="${NOVA_BUILD_TOOLS:-$SDK/build-tools/35.0.1}"
PLATFORM="${NOVA_ANDROID_JAR:-$SDK/platforms/android-35/android.jar}"
APP=app/src/main
VERSION="$(sed -n 's/.*android:versionName="\([0-9][0-9.]*\)".*/\1/p' "$APP/AndroidManifest.xml" | head -n 1)"
if [[ -z "$VERSION" ]];then echo 'Versão do manifesto ausente.' >&2; exit 1; fi
if [[ -n "${NOVA_KEYSTORE:-}" ]];then
  KEY="$NOVA_KEYSTORE"; OUT="${NOVA_OUT:-$PWD/artifacts/Nova-OS-$VERSION.apk}"
  [[ -r "$KEY" ]] || { echo 'Keystore de produção não encontrado.' >&2; exit 1; }
  : "${NOVA_KEY_ALIAS:?Defina o alias da chave}"
  : "${NOVA_KEYSTORE_PASS:?Defina a senha do keystore}"
  export NOVA_KEYSTORE_PASS NOVA_KEY_ALIAS
  export NOVA_KEY_PASS="${NOVA_KEY_PASS:-$NOVA_KEYSTORE_PASS}"
else
  KEY="${NOVA_DEBUG_KEYSTORE:-$HOME/.android/debug.keystore}"; OUT="${NOVA_OUT:-$PWD/artifacts/Nova-OS-$VERSION-debug.apk}"
  export NOVA_KEY_ALIAS=androiddebugkey NOVA_KEYSTORE_PASS=android NOVA_KEY_PASS=android
fi
if [[ ! -x "$BT/aapt2" || ! -r "$PLATFORM" ]];then
  echo 'Instale Android SDK Platform 35 e Build Tools 35.0.1 e exporte ANDROID_SDK_ROOT.' >&2; exit 1
fi
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/classes" "$TMP/dex" "$(dirname "$OUT")" "$(dirname "$KEY")"
if [[ ! -f "$KEY" ]];then
  (umask 077; keytool -genkeypair -noprompt -storetype JKS -keystore "$KEY" -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Android Debug,O=Android,C=US' >/dev/null 2>&1)
fi
"$BT/aapt2" compile --dir "$APP/res" -o "$TMP/res.zip"
"$BT/aapt2" link -I "$PLATFORM" --manifest "$APP/AndroidManifest.xml" -A "$APP/assets" -o "$TMP/unsigned.apk" "$TMP/res.zip"
mapfile -t JAVA < <(find "$APP/java" -name '*.java' -print | LC_ALL=C sort)
javac -encoding UTF-8 -source 8 -target 8 -bootclasspath "$PLATFORM:$BT/core-lambda-stubs.jar" -d "$TMP/classes" "${JAVA[@]}"
jar cf "$TMP/classes.jar" -C "$TMP/classes" .
"$BT/d8" --min-api 23 --lib "$PLATFORM" --output "$TMP/dex" "$TMP/classes.jar"
(cd "$TMP/dex" && zip -q "$TMP/unsigned.apk" classes*.dex)
"$BT/zipalign" -f 4 "$TMP/unsigned.apk" "$TMP/aligned.apk"
"$BT/apksigner" sign --v4-signing-enabled false --ks "$KEY" --ks-key-alias "$NOVA_KEY_ALIAS" --ks-pass env:NOVA_KEYSTORE_PASS --key-pass env:NOVA_KEY_PASS --out "$OUT" "$TMP/aligned.apk"
"$BT/apksigner" verify --verbose "$OUT"
"$BT/zipalign" -c 4 "$OUT"
printf '\nAPK: %s\n' "$OUT"
