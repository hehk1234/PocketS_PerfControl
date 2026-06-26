#!/system/bin/sh
# Prepara state dir e invalida caches no boot

STATEDIR="/data/adb/pockets_perfcontrol"
mkdir -p "$STATEDIR"
chmod 0700 "$STATEDIR"

# Invalida cache de thermal zones (IDs podem mudar entre kernels)
rm -f "$STATEDIR/zones_gpu.cache" \
      "$STATEDIR/zones_cpu.cache" \
      "$STATEDIR/zone_skin.cache" \
      "$STATEDIR/cdevs_critical.cache" \
      "$STATEDIR/cdevs_pause.cache" \
      "$STATEDIR/cdev_throttle.cache" \
      "$STATEDIR/skin_trip_idx.cache"

chmod 0755 /data/adb/modules/pockets_perfcontrol/bin/perfctl 2>/dev/null
ln -sf /data/adb/modules/pockets_perfcontrol/bin/perfctl /data/adb/ksu/bin/perfctl 2>/dev/null
