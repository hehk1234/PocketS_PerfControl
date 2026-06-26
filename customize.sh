#!/system/bin/sh
SKIPUNZIP=0

ui_print ""
ui_print "*****************************************"
ui_print "  Pocket S Performance Control"
ui_print "  by kirimu"
ui_print "*****************************************"
ui_print ""

RO_DEVICE=$(getprop ro.product.device)
RO_MODEL=$(getprop ro.product.model)
ui_print "- Device: $RO_DEVICE / $RO_MODEL"

case "$RO_DEVICE$RO_MODEL" in
  *PocketS*|*pockets*|*POCKETS*) ui_print "- Pocket S confirmado / confirmed" ;;
  *) ui_print "! Device nao reconhecido / not recognized. Modulo / module assumes SM8550." ;;
esac

set_perm_recursive "$MODPATH" 0 0 0755 0644
set_perm "$MODPATH/bin/perfctl" 0 0 0755
set_perm "$MODPATH/bin/PocketSTiles.apk" 0 0 0644
set_perm "$MODPATH/post-fs-data.sh" 0 0 0755
set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/uninstall.sh" 0 0 0755
set_perm "$MODPATH/action.sh" 0 0 0755 2>/dev/null

APK="$MODPATH/bin/PocketSTiles.apk"
APK_PKG="com.kirimu.pockets"

if [ -f "$APK" ] && [ "$(getprop sys.boot_completed)" = "1" ]; then
  ui_print "- Instalando / Installing Quick Settings Tiles..."
  if pm install -r "$APK" >/dev/null 2>&1; then
    ui_print "  ok (3 tiles: Mode, Thermal, RAM)"
  else
    ui_print "  pm install falhou / failed — sera instalado no boot"
  fi
else
  ui_print "- Tile sera instalado apos o reboot"
  ui_print "- Tile will be installed after reboot"
fi

EXIST=$(getprop persist.pockets.mode)
[ -z "$EXIST" ] && setprop persist.pockets.mode 0

ui_print ""
ui_print "*****************************************"
ui_print "  IMPORTANTE - APOS O REBOOT"
ui_print "  IMPORTANT - AFTER REBOOT"
ui_print "*****************************************"
ui_print ""
ui_print "  [PT-BR]"
ui_print "  1) Abra o KernelSU Manager > SuperUser"
ui_print "  2) Autorize root para 'Pocket S Tiles'"
ui_print "  3) Adicione os tiles em Quick Settings:"
ui_print "     Painel de notif. > Editar > "
ui_print "     Pocket S, Pocket S Thermal, Pocket S RAM"
ui_print ""
ui_print "  [EN-US]"
ui_print "  1) Open KernelSU Manager > SuperUser"
ui_print "  2) Grant root to 'Pocket S Tiles'"
ui_print "  3) Add the tiles in Quick Settings:"
ui_print "     Notification Panel > Edit > "
ui_print "     Pocket S, Pocket S Thermal, Pocket S RAM"
ui_print ""
ui_print "- Reboot necessario / required"
ui_print ""
