#!/system/bin/sh
# service.sh — apos boot_completed: instala APK, pre-warm cache, aplica modo persistido

MODDIR="${0%/*}"
APK="$MODDIR/bin/PocketSTiles.apk"
APK_PKG="com.kirimu.pockets"
LOGFILE="/data/adb/pockets_perfcontrol/perfctl.log"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') | service | $*" >> "$LOGFILE" 2>/dev/null; }

# Aguarda boot_completed (timeout 5min)
COUNT=0
while [ "$(getprop sys.boot_completed)" != "1" ]; do
  sleep 5
  COUNT=$((COUNT+1))
  [ "$COUNT" -gt 60 ] && exit 1
done

sleep 15  # package manager subir completo

if [ -f "$APK" ]; then
  is_installed() { pm path "$APK_PKG" >/dev/null 2>&1; }

  # versionCode instalado no sistema.
  INSTALLED_VC=$(dumpsys package "$APK_PKG" 2>/dev/null | awk -F= '/versionCode=/{print $2; exit}' | awk '{print $1}')
  # versionCode do APK que veio NESTE modulo: gravado pelo customize.sh na
  # instalacao do modulo, em apk_vc. (Ler versionCode de um APK-arquivo via
  # dumpsys/aapt nao e confiavel em todo ROM; o arquivo-marca e robusto.)
  MODULE_VC=$(cat "$MODDIR/apk_vc" 2>/dev/null)
  log "PocketSTiles: instalado=vc${INSTALLED_VC:-(none)} modulo=vc${MODULE_VC:-(?)}"

  # IMPORTANTE: reinstalar o APK a cada boot quebra os tiles ja na status bar
  # (apos alguns reboots somem). So instalamos quando:
  #   - app ausente, ou
  #   - versao do modulo != instalada (update real), ou
  #   - nao conseguimos determinar a versao do modulo (fallback seguro: so se ausente)
  need_install=0
  if ! is_installed; then
    need_install=1
    log "PocketSTiles ausente — instalando"
  elif [ -n "$MODULE_VC" ] && [ -n "$INSTALLED_VC" ] && [ "$INSTALLED_VC" != "$MODULE_VC" ]; then
    need_install=1
    log "PocketSTiles versao diferente (inst=$INSTALLED_VC mod=$MODULE_VC) — atualizando"
  else
    log "PocketSTiles ok — preservando (sem reinstalar, mantem os tiles)"
  fi

  if [ "$need_install" = "1" ]; then
    installed_ok=0
    OUT=$(pm install -r -d "$APK" 2>&1)
    if echo "$OUT" | grep -qi "Success"; then
      log "PocketSTiles instalado OK"; installed_ok=1
    else
      log "pm install -r -d falhou: $OUT"
      OUT2=$(pm install -r "$APK" 2>&1)
      if echo "$OUT2" | grep -qi "Success"; then
        log "PocketSTiles instalado OK (fallback -r)"; installed_ok=1
      else
        log "pm install -r falhou: $OUT2"
        # Ultimo recurso (destrutivo): SO se o app nao estava instalado.
        if ! is_installed; then
          OUT3=$(pm install "$APK" 2>&1)
          if echo "$OUT3" | grep -qi "Success"; then
            log "PocketSTiles instalado OK (limpo)"; installed_ok=1
          else
            sleep 5
            OUT4=$(pm install "$APK" 2>&1)
            echo "$OUT4" | grep -qi "Success" && { log "OK (retry)"; installed_ok=1; } || log "FALHA TOTAL: $OUT4"
          fi
        fi
      fi
    fi
    [ "$installed_ok" = "0" ] && is_installed && installed_ok=1
    [ "$installed_ok" = "0" ] && log "AVISO: PocketSTiles NAO instalado apos tentativas"
  fi
fi

sleep 10  # vendor services subirem

# Pre-warm cache de thermal zones (evita ~3s no primeiro perfctl set)
"$MODDIR/bin/perfctl" thermal warmup >/dev/null 2>&1 &

MODE=$(getprop persist.pockets.mode)
case "$MODE" in 0|1|2) ;; *) MODE=0 ;; esac

# Aplica o modo persistido. Roda em background + reaplica algumas vezes porque
# o vendor daemon (mm-qcom-perfd / thermal-engine) sobe os cdevs de throttle
# DEPOIS do boot_completed, sobrescrevendo nossas freqs. Reaplicar pega o vendor.
(
  "$MODDIR/bin/perfctl" set "$MODE" >/dev/null 2>&1
  log "boot: modo $MODE aplicado (1a vez)"
  # Reaplica apos 15s, 30s, 60s — janela em que o vendor costuma subir cdevs
  for delay in 15 15 30; do
    sleep "$delay"
    "$MODDIR/bin/perfctl" set "$MODE" >/dev/null 2>&1
    log "boot: modo $MODE reaplicado (pos +${delay}s)"
  done
) &
