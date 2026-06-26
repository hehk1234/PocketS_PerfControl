#!/system/bin/sh
# Cicla entre os 3 modos: 0 -> 1 -> 2 -> 0
MODDIR="${0%/*}"
PERFCTL="$MODDIR/bin/perfctl"

CUR=$("$PERFCTL" get 2>/dev/null)
[ -z "$CUR" ] && CUR=0

case "$CUR" in
  0) NEW=1 ;;
  1) NEW=2 ;;
  *) NEW=0 ;;
esac

"$PERFCTL" set "$NEW"

NAMES="Balanced Performance High_Performance"
NAME=$(echo "$NAMES" | awk -v n="$NEW" '{print $(n+1)}')
echo "Modo atual: $NAME ($NEW)"
