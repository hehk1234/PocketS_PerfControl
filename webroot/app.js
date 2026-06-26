/* Pocket S Perf Control — WebUI by kirimu */

(function(){
'use strict';

const ksu = {
  exec(cmd){
    if (typeof window.ksu === 'undefined' || !window.ksu){
      console.warn('[ksu missing] cmd:', cmd);
      return { errno: 127, stdout: '', stderr: 'ksu bridge missing (dev mode)' };
    }
    try{
      const r = window.ksu.exec(cmd);
      if (typeof r === 'string'){
        try { return JSON.parse(r); }
        catch(e){ return { errno: 0, stdout: r, stderr: '' }; }
      }
      if (r && typeof r === 'object') return r;
      return { errno: 1, stdout: '', stderr: 'unknown response' };
    } catch(e){
      return { errno: 1, stdout: '', stderr: String(e) };
    }
  }
};

const PERFCTL = '/data/adb/modules/pockets_perfcontrol/bin/perfctl';
function pctl(){ return PERFCTL; }

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ============ i18n ============ */

const I18N = {
  pt: {
    mode_standard: 'Standard',
    mode_performance: 'Performance',
    mode_high: 'High',
    thermal_label: 'THERMAL',
    apply: 'APLICAR',
    thermal_auto_note: 'Aplicado automaticamente ao alterar.',
    ramclean_label: 'RAM CLEANER',
    ramclean_desc: 'Limpa pagecache, processos em background e libera RAM.',
    ramclean_normal: 'LIMPAR RAM',
    restore_original: 'RESTAURAR ORIGINAL',
    view_log: 'VER LOG',
    // toasts
    toast_mode_ok: ['STANDARD OK', 'PERFORMANCE OK', 'HIGH PERF OK'],
    toast_fail: 'FALHA',
    toast_trips_ok: 'TRIPS OK',
    toast_revert_ok: 'REVERT OK',
    toast_revert_fail: 'FALHA REVERT',
    toast_cleaning: 'LIMPANDO...',
    toast_clean_ok: 'RAM LIMPA',
    confirm_revert: 'Restaurar ao estado original?',
    modal_ok: 'Confirmar',
    modal_cancel: 'Cancelar',
    log_empty: '(log vazio)',
    result_freed: 'liberado',
    // limits
    limits_label: 'LIMITS',
    limits_desc: 'Limites manuais por cluster (sobrescreve o modo).',
    lim_silver: 'CPU Silver (cpu0-2)',
    lim_gold: 'CPU Gold (cpu3-6)',
    lim_prime: 'CPU Prime (cpu7)',
    lim_gpu: 'GPU',
    lim_min: 'MIN',
    lim_max: 'MAX',
    lim_reset: 'RESET',
    limits_applied: 'LIMITS OK',
    limits_reset: 'LIMITS RESETADOS',
    limits_auto_note: 'Aplicado automaticamente ao alterar.',
    confirm_lim_reset: 'Resetar todos os limites manuais?',
    // experimental
    exp_label: 'EXPERIMENTAL',
    exp_950_title: 'GPU 950MHz',
    exp_950_desc: 'Limita a GPU a 950MHz no modo High (voltagem menor, mais energia para a CPU). Requer dtbo com o nivel de 950MHz.',
    exp_on_ok: '950MHz ATIVADO',
    exp_off_ok: '950MHz DESATIVADO',
    exp_no_950: 'Aviso: 950MHz nao encontrado na GPU. Flashe o dtbo (KonaBess) primeiro.',
    exp_active: 'Ativo: GPU limitada a 950MHz no High.',
    exp_inactive_off: 'Desligado.',
    exp_inactive_no950: 'Ligado, mas o nivel de 950MHz nao existe na GPU (flashe o dtbo).'
  },
  en: {
    mode_standard: 'Standard',
    mode_performance: 'Performance',
    mode_high: 'High',
    thermal_label: 'THERMAL',
    apply: 'APPLY',
    thermal_auto_note: 'Applied automatically on change.',
    ramclean_label: 'RAM CLEANER',
    ramclean_desc: 'Clears pagecache, background processes and frees up RAM.',
    ramclean_normal: 'CLEAN RAM',
    restore_original: 'RESTORE ORIGINAL',
    view_log: 'VIEW LOG',
    toast_mode_ok: ['STANDARD OK', 'PERFORMANCE OK', 'HIGH PERF OK'],
    toast_fail: 'FAILED',
    toast_trips_ok: 'TRIPS OK',
    toast_revert_ok: 'REVERT OK',
    toast_revert_fail: 'REVERT FAILED',
    toast_cleaning: 'CLEANING...',
    toast_clean_ok: 'RAM CLEANED',
    confirm_revert: 'Restore to original state?',
    modal_ok: 'Confirm',
    modal_cancel: 'Cancel',
    log_empty: '(log empty)',
    result_freed: 'freed',
    // limits
    limits_label: 'LIMITS',
    limits_desc: 'Manual per-cluster limits (overrides mode).',
    lim_silver: 'CPU Silver (cpu0-2)',
    lim_gold: 'CPU Gold (cpu3-6)',
    lim_prime: 'CPU Prime (cpu7)',
    lim_gpu: 'GPU',
    lim_min: 'MIN',
    lim_max: 'MAX',
    lim_reset: 'RESET',
    limits_applied: 'LIMITS OK',
    limits_reset: 'LIMITS RESET',
    limits_auto_note: 'Applied automatically on change.',
    confirm_lim_reset: 'Reset all manual limits?',
    // experimental
    exp_label: 'EXPERIMENTAL',
    exp_950_title: 'GPU 950MHz',
    exp_950_desc: 'Caps the GPU at 950MHz in High mode (lower voltage, more power for the CPU). Requires a dtbo with the 950MHz level.',
    exp_on_ok: '950MHz ENABLED',
    exp_off_ok: '950MHz DISABLED',
    exp_no_950: 'Warning: 950MHz not found on GPU. Flash the dtbo (KonaBess) first.',
    exp_active: 'Active: GPU capped at 950MHz in High.',
    exp_inactive_off: 'Off.',
    exp_inactive_no950: 'On, but the 950MHz level does not exist on the GPU (flash the dtbo).'
  }
};

let LANG = 'pt';
function t(key){
  return I18N[LANG][key] || I18N.pt[key] || key;
}

function applyI18n(){
  // Atualiza elementos com data-i18n
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val) el.textContent = val;
  });
  // Atualiza language buttons
  $$('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === LANG);
  });
  // Atualiza html lang
  document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en-US';
  // Salva preferencia
  try { localStorage.setItem('pockets_lang', LANG); } catch(e){}
}

function setLang(lang){
  if (lang !== 'pt' && lang !== 'en') return;
  LANG = lang;
  applyI18n();
}

function fmtTemp(mC){
  if (mC === null || mC === undefined || isNaN(mC) || +mC === 0) return '—';
  return (+mC / 1000).toFixed(1) + '°C';
}

let toastTimer = null;
function toast(msg, kind){
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast show ' + (kind || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 2200);
}

// Modal de confirmacao proprio. O confirm() nativo NAO funciona na WebView do
// KernelSU (retorna sem bloquear), o que quebrava os botoes de reset/revert.
// Retorna uma Promise<boolean>.
function confirmModal(msg){
  return new Promise((resolve) => {
    const overlay = $('#confirmModal');
    const msgEl = $('#confirmMsg');
    const okBtn = $('#confirmOk');
    const cancelBtn = $('#confirmCancel');
    if (!overlay || !okBtn || !cancelBtn){
      // fallback: se o modal nao existir por algum motivo, segue sem bloquear
      resolve(true);
      return;
    }
    msgEl.textContent = msg;
    overlay.classList.add('show');
    const cleanup = (result) => {
      overlay.classList.remove('show');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      resolve(result);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onBackdrop = (e) => { if (e.target === overlay) cleanup(false); };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
  });
}

/* ============ MODE select ============ */

function applyMode(modeNum){
  const card = $('#mode' + modeNum);
  if (!card) return;
  card.classList.add('applying');
  setTimeout(() => card.classList.remove('applying'), 700);

  const r = ksu.exec(pctl() + ' set ' + modeNum);
  if (r.errno === 0){
    toast(t('toast_mode_ok')[modeNum], 'ok');
    refreshActive(modeNum);
  } else {
    toast(t('toast_fail'), 'err');
  }
  fetchStatus();
}

function refreshActive(modeNum){
  $$('.mode-card').forEach(c => c.classList.remove('is-active'));
  const active = $('#mode' + modeNum);
  if (active) active.classList.add('is-active');

  const pill = $('#modePill');
  pill.dataset.mode = modeNum;
  const labels = ['STANDARD', 'PERFORMANCE', 'HIGH'];
  $('#modePillText').textContent = labels[modeNum] || '—';
}

function bindModeCards(){
  $$('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      applyMode(parseInt(card.dataset.mode, 10));
    });
  });
}

/* ============ STATUS poll ============ */

// Mapeia campos limits do JSON pra IDs dos selects na UI
const LIMIT_FIELD_TO_SELECT = {
  silver_min: 'limSilverMin',
  silver_max: 'limSilverMax',
  gold_min:   'limGoldMin',
  gold_max:   'limGoldMax',
  prime_min:  'limPrimeMin',
  prime_max:  'limPrimeMax',
  gpu_min:    'limGpuMin',
  gpu_max:    'limGpuMax'
};

function fetchStatus(){
  const r = ksu.exec(pctl() + ' status');
  if (r.errno !== 0) return;
  let s;
  try { s = JSON.parse(r.stdout); }
  catch(e){ return; }

  if (s.thermal){
    $('#skinCur').textContent = fmtTemp(s.thermal.skin_temp);
    $('#cpuCur').textContent  = fmtTemp(s.thermal.cpu_max);
    $('#gpuCur').textContent  = fmtTemp(s.thermal.gpu_max);

    // Sincroniza sliders com thermal.conf (user_*) — atualiza SEMPRE,
    // exceto se o usuario esta interagindo agora (dataset.touched temporario).
    // touched eh limpo apos 5s de inatividade
    syncSlider('skinSlider', 'skinVal', s.thermal.user_skin || s.thermal.skin_trip);
    syncSlider('cpuSlider',  'cpuVal',  s.thermal.user_cpu);
    syncSlider('gpuSlider',  'gpuVal',  s.thermal.user_gpu);
  }

  // Sincroniza limits selects com user_limits.conf
  if (s.limits){
    Object.keys(LIMIT_FIELD_TO_SELECT).forEach(field => {
      const sel = $('#' + LIMIT_FIELD_TO_SELECT[field]);
      if (!sel || sel.dataset.touched) return;
      const newVal = String(s.limits[field] || '');
      if (sel.value !== newVal) sel.value = newVal;
    });
  }

  refreshActive(s.mode ?? 0);
}

function syncSlider(slId, valId, newVal){
  const sl = $('#' + slId);
  if (!sl || !newVal) return;
  // Se usuario tocou no slider recentemente (dataset.touched setado),
  // nao sobrescreve. touched eh reset apos 5s sem input.
  if (sl.dataset.touched) return;
  const target = parseInt(newVal, 10);
  if (!isNaN(target) && parseInt(sl.value, 10) !== target){
    sl.value = target;
    updateSliderUI(sl, $('#' + valId));
  }
}

/* ============ THERMAL ============ */

function updateSliderUI(slider, output){
  const v = parseInt(slider.value, 10);
  const c = Math.round(v / 1000);
  output.textContent = c + '°C';
  const pct = ((v - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--pct', pct + '%');
}

function bindThermalSliders(){
  const pairs = [
    ['skinSlider', 'skinVal', 'skin'],
    ['cpuSlider',  'cpuVal',  'cpu'],
    ['gpuSlider',  'gpuVal',  'gpu'],
  ];
  pairs.forEach(([sId, vId, field]) => {
    const sl = $('#' + sId);
    const out = $('#' + vId);
    let touchedTimer = null;
    let applyTimer = null;
    // input event = dispara enquanto arrasta. Aplica com debounce.
    sl.addEventListener('input', () => {
      sl.dataset.touched = '1';
      updateSliderUI(sl, out);
      clearTimeout(touchedTimer);
      touchedTimer = setTimeout(() => { delete sl.dataset.touched; }, 5000);
      // Debounce: aplica 400ms apos ultimo input (evita bombardear perfctl)
      clearTimeout(applyTimer);
      applyTimer = setTimeout(() => {
        const v = parseInt(sl.value, 10);
        const r = ksu.exec(pctl() + ' thermal set ' + field + ' ' + v);
        if (r.errno === 0) toast(t('toast_trips_ok'), 'ok');
        else toast(t('toast_fail'), 'err');
        setTimeout(fetchStatus, 200);
      }, 400);
    });
    updateSliderUI(sl, out);
  });
}

/* ============ RAM CLEANER ============ */

function bindRamClean(){
  const btn = $('#btnRamClean');
  const result = $('#ramCleanResult');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    result.textContent = '...';
    toast(t('toast_cleaning'));

    setTimeout(() => {
      const r = ksu.exec(pctl() + ' ramclean');
      btn.disabled = false;

      if (r.errno !== 0){
        toast(t('toast_fail'), 'err');
        result.textContent = '';
        return;
      }
      const out = (r.stdout || '').trim();
      let freed = '';
      out.split('\n').forEach(line => {
        const m = line.match(/^liberado:\s*(\d+)\s*MB/);
        if (m) freed = m[1];
      });
      if (freed){
        const msg = t('toast_clean_ok') + ' — ' + freed + ' MB';
        toast(msg, 'ok');
        result.textContent = msg;
      } else {
        toast(t('toast_clean_ok'), 'ok');
        result.textContent = t('toast_clean_ok');
      }
    }, 50);
  });
}

/* ============ LIMITS (CPU/GPU manual) ============ */

// Tabelas de frequencias. CPU = fixas (scaling_available_frequencies estaveis).
// GPU = FALLBACK apenas; a tabela real e lida dinamicamente do device em
// populateLimitSelects (readGpuFreqs), pra suportar downclock/UV via KonaBess.
const FREQS = {
  silver: [307200, 441600, 556800, 672000, 787200, 902400, 1017600, 1113600,
           1228800, 1344000, 1459200, 1555200, 1670400, 1785600, 1900800, 2016000],
  gold:   [499200, 614400, 729600, 844800, 940800, 1056000, 1171200, 1286400,
           1401600, 1536000, 1651200, 1785600, 1920000, 2054400, 2188800,
           2323200, 2457600, 2592000, 2707200, 2803200],
  prime:  [595200, 729600, 864000, 998400, 1132800, 1248000, 1363200, 1478400,
           1593600, 1708800, 1843200, 1977600, 2092800, 2227200, 2342400,
           2476800, 2592000, 2726400, 2841600, 2956800, 3187200, 3360000],
  gpu:    [124800000, 220000000, 295000000, 348000000, 401000000, 475000000,
           550000000, 615000000, 680000000, 719000000, 746000000, 794000000,
           827000000, 860000000, 1000000000]
};

function fmtFreqKhz(k){
  if (k >= 1000000) return (k/1000000).toFixed(2).replace(/\.?0+$/, '') + ' GHz';
  return (k/1000).toFixed(0) + ' MHz';
}
function fmtFreqHz(h){
  if (h >= 1000000000) return (h/1000000000).toFixed(2).replace(/\.?0+$/, '') + ' GHz';
  return (h/1000000).toFixed(0) + ' MHz';
}

// Le a tabela REAL de frequencias da GPU do device (available_frequencies).
// Essencial pra quando o usuario faz downclock/UV via KonaBess: a tabela muda e
// os valores hardcoded ficariam errados. Retorna array de Hz (decrescente) ou
// null se nao conseguir ler (cai no fallback FREQS.gpu).
function readGpuFreqs(){
  const r = ksu.exec('cat /sys/class/kgsl/kgsl-3d0/devfreq/available_frequencies 2>/dev/null');
  if (!r || r.errno !== 0 || !r.stdout) return null;
  const freqs = r.stdout.trim().split(/\s+/)
    .map(x => parseInt(x, 10))
    .filter(n => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a);   // decrescente (maior primeiro)
  return freqs.length ? freqs : null;
}

function populateLimitSelects(){
  function fillSelect(elId, freqs, formatter){
    const sel = $('#' + elId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— default —</option>';
    freqs.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = formatter(f);
      sel.appendChild(opt);
    });
  }
  fillSelect('limSilverMin', FREQS.silver, fmtFreqKhz);
  fillSelect('limSilverMax', FREQS.silver, fmtFreqKhz);
  fillSelect('limGoldMin',   FREQS.gold,   fmtFreqKhz);
  fillSelect('limGoldMax',   FREQS.gold,   fmtFreqKhz);
  fillSelect('limPrimeMin',  FREQS.prime,  fmtFreqKhz);
  fillSelect('limPrimeMax',  FREQS.prime,  fmtFreqKhz);
  // GPU: tabela DINAMICA do device (suporta downclock/UV via KonaBess).
  // Fallback pra tabela de fabrica se a leitura falhar.
  const gpuFreqs = readGpuFreqs() || FREQS.gpu;
  fillSelect('limGpuMin',    gpuFreqs,    fmtFreqHz);
  fillSelect('limGpuMax',    gpuFreqs,    fmtFreqHz);
}

function loadLimitState(){
  // Lê user_limits.conf via cat e seta os selects
  const r = ksu.exec('cat /data/adb/modules/pockets_perfcontrol/etc/user_limits.conf 2>/dev/null');
  if (r.errno !== 0) return;
  const conf = r.stdout || '';
  const map = {
    'CPU_SILVER_MIN': 'limSilverMin',
    'CPU_SILVER_MAX': 'limSilverMax',
    'CPU_GOLD_MIN':   'limGoldMin',
    'CPU_GOLD_MAX':   'limGoldMax',
    'CPU_PRIME_MIN':  'limPrimeMin',
    'CPU_PRIME_MAX':  'limPrimeMax',
    'GPU_MIN':        'limGpuMin',
    'GPU_MAX':        'limGpuMax'
  };
  conf.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) return;
    const key = m[1];
    const val = (m[2] || '').trim();
    const selId = map[key];
    if (selId){
      const sel = $('#' + selId);
      if (sel) sel.value = val;
    }
  });
}

// Mapa do select pra [dominio, campo] do comando perfctl
const LIMIT_SELECT_TO_CMD = {
  limSilverMin: ['cpu', 'silver_min'],
  limSilverMax: ['cpu', 'silver_max'],
  limGoldMin:   ['cpu', 'gold_min'],
  limGoldMax:   ['cpu', 'gold_max'],
  limPrimeMin:  ['cpu', 'prime_min'],
  limPrimeMax:  ['cpu', 'prime_max'],
  limGpuMin:    ['gpu', 'min'],
  limGpuMax:    ['gpu', 'max']
};

function applyLimit(selId){
  const sel = $('#' + selId);
  if (!sel) return false;
  const map = LIMIT_SELECT_TO_CMD[selId];
  if (!map) return false;
  const [dom, field] = map;
  const v = (sel.value || '').trim();
  const cmd = pctl() + ' limit ' + dom + ' ' + field + ' ' + (v || '""');
  const r = ksu.exec(cmd);
  return r.errno === 0;
}

function bindLimits(){
  populateLimitSelects();
  loadLimitState();

  // APLICAR AUTOMATICAMENTE ao mudar qualquer select
  // touched eh usado pra evitar que o polling sobrescreva enquanto user interage
  Object.keys(LIMIT_SELECT_TO_CMD).forEach(id => {
    const sel = $('#' + id);
    if (!sel) return;
    let timer = null;
    sel.addEventListener('change', () => {
      sel.dataset.touched = '1';
      const ok = applyLimit(id);
      if (ok){
        toast(t('limits_applied'), 'ok');
      } else {
        toast(t('toast_fail'), 'err');
      }
      clearTimeout(timer);
      timer = setTimeout(() => { delete sel.dataset.touched; }, 5000);
      setTimeout(fetchStatus, 200);
    });
  });

  // Botao reset
  $('#btnLimReset').addEventListener('click', async () => {
    if (!(await confirmModal(t('confirm_lim_reset')))) return;
    const r = ksu.exec(pctl() + ' limit reset');
    if (r.errno === 0){
      Object.keys(LIMIT_SELECT_TO_CMD).forEach(id => {
        const el = $('#' + id);
        if (el) delete el.dataset.touched;
      });
      toast(t('limits_reset'), 'ok');
      setTimeout(() => { loadLimitState(); fetchStatus(); }, 300);
    } else {
      toast(t('toast_fail'), 'err');
    }
  });
}

/* ============ LANG ============ */

function bindLang(){
  $$('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
    });
  });
}

/* ============ ADVANCED ============ */

function bindAdvanced(){
  $('#btnRevert').addEventListener('click', async () => {
    if (!(await confirmModal(t('confirm_revert')))) return;
    const r = ksu.exec(pctl() + ' revert');
    if (r.errno === 0){
      toast(t('toast_revert_ok'), 'ok');
      setTimeout(fetchStatus, 350);
    } else {
      toast(t('toast_revert_fail'), 'err');
    }
  });

  $('#btnLog').addEventListener('click', () => {
    const box = $('#logBox');
    if (box.open){ box.open = false; return; }
    const r = ksu.exec('tail -60 /data/adb/pockets_perfcontrol/perfctl.log 2>/dev/null');
    $('#logContent').textContent = r.stdout || t('log_empty');
    box.open = true;
  });
}

/* ============ EXPERIMENTAL (950MHz) ============ */

// Le o estado experimental via tile-state e atualiza o toggle + texto de status.
function refreshExperimental(){
  const r = ksu.exec(pctl() + ' tile-state');
  if (r.errno !== 0 || !r.stdout) return;
  let exp = false, has950 = false;
  r.stdout.split('\n').forEach(line => {
    const s = line.trim();
    if (s === 'EXP=1') exp = true;
    if (s === 'GPU950=1') has950 = true;
  });
  const toggle = $('#expToggle');
  const status = $('#expStatus');
  if (toggle) toggle.checked = exp;
  if (status){
    if (exp && has950) status.textContent = t('exp_active');
    else if (exp && !has950) status.textContent = t('exp_inactive_no950');
    else status.textContent = t('exp_inactive_off');
  }
}

function bindExperimental(){
  const toggle = $('#expToggle');
  if (!toggle) return;
  toggle.addEventListener('change', () => {
    const want = toggle.checked ? 'on' : 'off';
    const r = ksu.exec(pctl() + ' experimental ' + want);
    const out = (r.stdout || '');
    if (toggle.checked){
      // Avisa se o 950 nao esta na tabela (toggle liga mesmo assim)
      if (out.indexOf('AVISO') !== -1 || out.indexOf('nao encontrado') !== -1){
        toast(t('exp_no_950'), 'err');
      } else {
        toast(t('exp_on_ok'), 'ok');
      }
    } else {
      toast(t('exp_off_ok'), 'ok');
    }
    setTimeout(() => { refreshExperimental(); fetchStatus(); }, 400);
  });
}

/* ============ init ============ */

document.addEventListener('DOMContentLoaded', () => {
  // Carrega lang salvo
  try {
    const saved = localStorage.getItem('pockets_lang');
    if (saved === 'en' || saved === 'pt') LANG = saved;
  } catch(e){}

  bindLang();
  bindModeCards();
  bindThermalSliders();
  bindRamClean();
  bindLimits();
  bindAdvanced();
  bindExperimental();
  applyI18n();
  // Atualiza a versao no rodape lendo o module.prop (fonte unica de verdade —
  // evita versao hardcoded desatualizada).
  try {
    const rv = ksu.exec("grep '^version=' /data/adb/modules/pockets_perfcontrol/module.prop 2>/dev/null | cut -d= -f2");
    if (rv && rv.errno === 0 && rv.stdout && rv.stdout.trim()){
      const vEl = $('#appVersion');
      if (vEl) vEl.textContent = rv.stdout.trim();
    }
  } catch(e){}
  fetchStatus();
  refreshExperimental();

  setInterval(() => {
    if (document.hidden) return;
    fetchStatus();
  }, 1500);
});

})();
