#!/system/bin/sh
# Revert + cleanup + remove APK
MODDIR="${0%/*}"
APK_PKG="com.kirimu.pockets"

"$MODDIR/bin/perfctl" revert 2>/dev/null

setprop persist.pockets.mode ""
resetprop --delete persist.pockets.mode 2>/dev/null

rm -f /data/adb/ksu/bin/perfctl 2>/dev/null

if pm path "$APK_PKG" >/dev/null 2>&1; then
  pm uninstall "$APK_PKG" >/dev/null 2>&1
fi

# Apaga estado mas mantem log
rm -f /data/adb/pockets_perfcontrol/current_mode \
      /data/adb/pockets_perfcontrol/original_state.snapshot \
      /data/adb/pockets_perfcontrol/keeper.pid \
      /data/adb/pockets_perfcontrol/zones_*.cache \
      /data/adb/pockets_perfcontrol/zone_*.cache \
      /data/adb/pockets_perfcontrol/cdevs_*.cache
