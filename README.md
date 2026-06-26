# Pocket S Performance Control

Módulo KernelSU de controle de desempenho e temperatura para o **AYANEO Pocket S**
(Snapdragon 8 Gen 2 / SG8275, Adreno 740).

*KernelSU module for performance and thermal control on the **AYANEO Pocket S**.
English version below.*

> **Resumo:** três modos de desempenho (Standard econômico, Performance e High),
> presets térmicos ajustáveis, limites de clock por núcleo, tuning de I/O para
> mais responsividade, limpeza de RAM e três tiles de Quick Settings. Tudo
> controlável por uma WebUI bilíngue e totalmente reversível.

---
---

# 🇧🇷 Português

## Propósito

O Pocket S é um handheld potente, mas a configuração de fábrica é conservadora:
limita clocks, throttla cedo e não expõe controle fino de CPU/GPU/thermal. Este
módulo destrava o aparelho de forma segura e dá controle real sobre desempenho e
temperatura, com três modos prontos e ajustes finos opcionais — tudo reversível.

O objetivo é fazer o Pocket S entregar todo o potencial do SG8275, especialmente
em jogos e emulação, sem comprometer a saúde do aparelho (respeitando o limite
físico do silício e a proteção da bateria).

## Como funciona

O módulo tem quatro partes que trabalham juntas:

**1. CLI (`perfctl`)** — o motor. Um script que aplica os modos, ajusta thermal,
limites de clock por núcleo, limpa RAM e mantém os ajustes ativos contra o
gerenciador de energia do vendor (que tende a reverter mudanças sob carga).

**2. Daemon (keeper)** — processo leve que reaplica os ajustes periodicamente,
para o sistema não desfazer o que você configurou durante o uso. Tem três níveis
de atuação conforme o modo, do mais leve (sustentar clock sob demanda) ao mais
completo (manter tudo travado no High).

**3. Tiles de Quick Settings (APK)** — três atalhos na barra de notificações para
trocar de modo, alternar preset térmico e limpar RAM sem abrir nada.

**4. WebUI** — interface web (acessível pelo app do KernelSU) para ajustes finos:
presets térmicos, limites de clock por cluster, e o modo experimental. Bilíngue.

## Os três modos

| Modo | CPU | GPU | Uso |
|------|-----|-----|-----|
| **Standard** | Sobe ao turbo sob demanda, recai quando ocioso | Dinâmica | Dia a dia, equilíbrio |
| **Performance** | Turbo sob demanda, sustentado sob carga | Dinâmica alta | Jogos médios, multitarefa |
| **High** | Tudo no máximo, travado | Máxima | Jogos e emulação pesada |

Em **Standard** e **Performance**, os núcleos sobem até o turbo (gold 2.8 GHz,
prime 3.36 GHz) **quando o app pede** e sustentam o desempenho enquanto a carga
existe, recaindo quando ociosos — economizando bateria. No **High**, os clusters
ficam no teto o tempo todo, sem dó: é o modo para extrair o máximo.

## Presets térmicos

Ajustam o ponto em que o aparelho começa a reduzir desempenho por temperatura
(throttling). Quanto mais alto, mais o aparelho sustenta clock antes de recuar.

| Preset | SKIN | CPU | GPU |
|--------|------|-----|-----|
| Stock | 46.5 °C | 100 °C | 95 °C |
| Mild | 58 °C | 105 °C | 100 °C |
| Aggressive | 68 °C | 108 °C | 105 °C |
| Extreme | 78 °C | 110 °C | 110 °C |

O Pocket S tem refrigeração ativa e a bateria fica **ao lado** do SoC (não embaixo),
então tolera presets mais agressivos que um celular. O limite físico do chip
(115 °C de junção) nunca é ultrapassado.

## Modo experimental (GPU 950 MHz)

Suporte opcional a um nível de GPU de 950 MHz, **desligado por padrão**. Só tem
efeito se você adicionar esse nível ao device tree da GPU (via KonaBess). Quando
ligado, no modo High a GPU é limitada a 950 MHz — frequência que usa voltagem
menor que 1 GHz, deixando mais orçamento de energia para a CPU em jogos que
dependem mais de processamento (emulação, por exemplo).

O módulo detecta sozinho se o nível existe; se você ligar sem ter feito a
alteração, ele apenas avisa e não muda nada. **O comportamento de fábrica fica
100% intacto** com o experimental desligado.

## Comandos principais (`perfctl`)

```
perfctl set 0|1|2          aplica modo (0=Standard 1=Performance 2=High)
perfctl get                modo atual
perfctl status             estado detalhado (clocks, trips, GPU)
perfctl thermal show       mostra os trips térmicos atuais
perfctl thermal set skin|cpu|gpu <valor_mC>
perfctl thermal reset      volta os trips ao padrão de fábrica
perfctl limit ...          limites manuais de clock por cluster
perfctl ramclean           libera memória
perfctl experimental on|off|status
perfctl revert             desfaz tudo e volta ao estado de fábrica
```

## Segurança

- Tudo é **reversível**: `perfctl revert` ou desinstalar o módulo restaura o padrão.
- O limite físico do silício (115 °C) nunca é ultrapassado.
- A proteção de corrente da bateria (BCL) não é desativada.
- O modo experimental não altera nada se o pré-requisito não existir.

## Requisitos

- AYANEO Pocket S (SG8275) · KernelSU · Android 13

---
---

# 🇺🇸 English

## Purpose

The Pocket S is a powerful handheld, but its factory setup is conservative: it
caps clocks, throttles early and exposes no fine-grained CPU/GPU/thermal control.
This module safely unlocks the device and gives real control over performance and
temperature, with three ready-made modes and optional fine-tuning — all reversible.

The goal is to make the Pocket S deliver the full potential of the 82758275,
especially in games and emulation, without compromising device health (respecting
the silicon's physical limit and battery protection).

## How it works

The module has four parts working together:

**1. CLI (`perfctl`)** — the engine. A script that applies modes, adjusts thermal
trips, per-core clock limits, clears RAM, and keeps settings active against the
vendor power manager (which tends to revert changes under load).

**2. Daemon (keeper)** — a lightweight process that reapplies settings
periodically so the system doesn't undo your configuration during use. It has
three levels of action depending on the mode, from the lightest (sustain clock on
demand) to the most complete (keep everything locked in High).

**3. Quick Settings tiles (APK)** — three shortcuts in the notification shade to
switch mode, cycle thermal preset and clear RAM without opening anything.

**4. WebUI** — web interface (via the KernelSU app) for fine-tuning: thermal
presets, per-cluster clock limits, and the experimental mode. Bilingual.

## The three modes

| Mode | CPU | GPU | Use |
|------|-----|-----|-----|
| **Standard** | Ramps to turbo on demand, drops when idle | Dynamic | Everyday, balanced |
| **Performance** | Turbo on demand, sustained under load | High dynamic | Mid games, multitasking |
| **High** | Everything maxed, locked | Maximum | Heavy gaming and emulation |

In **Standard** and **Performance**, cores ramp up to turbo (gold 2.8 GHz, prime
3.36 GHz) **when the app asks for it** and sustain performance while the load
exists, dropping back when idle — saving battery. In **High**, the clusters stay
at the ceiling all the time, no mercy: it's the mode to extract the maximum.

## Thermal presets

They adjust the point where the device starts reducing performance due to
temperature (throttling). The higher the value, the longer the device sustains
clocks before backing off.

| Preset | SKIN | CPU | GPU |
|--------|------|-----|-----|
| Stock | 46.5 °C | 100 °C | 95 °C |
| Mild | 58 °C | 105 °C | 100 °C |
| Aggressive | 68 °C | 108 °C | 105 °C |
| Extreme | 78 °C | 110 °C | 110 °C |

The Pocket S has active cooling and the battery sits **beside** the SoC (not
underneath), so it tolerates more aggressive presets than a phone. The chip's
physical limit (115 °C junction) is never exceeded.

## Experimental mode (GPU 950 MHz)

Optional support for a 950 MHz GPU level, **off by default**. It only takes effect
if you add that level to the GPU device tree (via KonaBess). When enabled, in High
mode the GPU is capped at 950 MHz — a frequency that uses lower voltage than
1 GHz, leaving more power budget for the CPU in compute-bound games (emulation,
for example).

The module auto-detects whether the level exists; if you enable it without having
made the change, it simply warns and changes nothing. **Factory behavior stays
100% intact** with experimental off.

## Main commands (`perfctl`)

```
perfctl set 0|1|2          apply mode (0=Standard 1=Performance 2=High)
perfctl get                current mode
perfctl status             detailed state (clocks, trips, GPU)
perfctl thermal show       show current thermal trips
perfctl thermal set skin|cpu|gpu <value_mC>
perfctl thermal reset      restore factory trips
perfctl limit ...          manual per-cluster clock limits
perfctl ramclean           free memory
perfctl experimental on|off|status
perfctl revert             undo everything and restore factory state
```

## Safety

- Everything is **reversible**: `perfctl revert` or uninstalling restores defaults.
- The silicon's physical limit (115 °C) is never exceeded.
- Battery current protection (BCL) is not disabled.
- Experimental mode changes nothing if the prerequisite isn't present.

## Requirements

- AYANEO Pocket S (82758275) · KernelSU · Android 13

---

*By hehk1234.*
