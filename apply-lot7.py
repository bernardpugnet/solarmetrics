#!/usr/bin/env python3
"""Lot 7: Simple mode UX. Robust marker-based approach."""
import os

def replace_between(content, start_marker, end_marker, new_content, include_end=False):
    """Replace content between two markers. Returns (new_content, success)."""
    s = content.find(start_marker)
    if s == -1:
        return content, False
    e = content.find(end_marker, s + len(start_marker))
    if e == -1:
        return content, False
    line_start = content.rfind('\n', 0, s) + 1
    if include_end:
        e += len(end_marker)
        # also consume trailing newline
        if e < len(content) and content[e] == '\n':
            e += 1
    else:
        line_end = content.rfind('\n', 0, e) + 1
        e = line_end
    return content[:line_start] + new_content + content[e:], True

NEW_PV_FR = '''                    <!-- Lot 7: Surface + puissance estimee -->
                    <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
                        <h4 class="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                            <span class="text-amber-500">&#x25CF;</span> Votre installation
                        </h4>
                        <div class="space-y-4">
                            <div>
                                <label class="text-[13px] text-slate-300 mb-1 block font-medium">Surface de toiture disponible (m&#xB2;)</label>
                                <input type="number" id="resSurfaceSimple" value="30" min="5" max="1000" step="1" oninput="updateKwcFromSurface()" class="w-full max-w-xs px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm">
                                <p class="mt-1 text-[13px] text-slate-500">Comptez environ 6 m&#xB2; par kWc install&#xe9;.</p>
                            </div>
                            <div class="p-3 bg-slate-800/60 rounded-lg border border-slate-700/40">
                                <p class="text-[13px] text-slate-400">Puissance estim&#xe9;e : <span id="kwcEstimate" class="text-amber-400 font-semibold">5.1 kWc</span></p>
                                <p class="text-[11px] text-slate-500 mt-1">Bas&#xe9; sur la surface et des panneaux monocristallins (20 %). Ajustable dans les param&#xe8;tres avanc&#xe9;s.</p>
                            </div>
                            <details id="manualKwcOverride">
                                <summary class="text-[12px] text-amber-400/70 hover:text-amber-400 cursor-pointer">J&#x2019;ai un devis : saisir la puissance exacte</summary>
                                <div class="mt-2">
                                    <input type="number" id="simPeakpower" min="0.5" max="100" step="0.1" value="5.1" oninput="onManualKwcChange()" class="w-full max-w-xs px-3 py-2 bg-slate-800 border border-amber-500/50 rounded-lg text-amber-300 text-sm font-medium">
                                </div>
                            </details>
                        </div>
                    </div>

'''

NEW_BAT_FR = '''                        <div id="batteryCapacitySection" style="display:none" class="space-y-3">
                            <div class="flex gap-2">
                                <button type="button" onclick="selectBatteryPreset(5)" class="battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-slate-600 text-slate-400 hover:border-amber-500/50" data-kwh="5">
                                    <span class="block font-medium">5 kWh</span>
                                    <span class="block text-[11px] text-slate-500 mt-0.5">Petit</span>
                                </button>
                                <button type="button" onclick="selectBatteryPreset(10)" class="battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-amber-500/50 text-amber-300 bg-amber-500/10" data-kwh="10">
                                    <span class="block font-medium">10 kWh</span>
                                    <span class="block text-[11px] text-amber-400/60 mt-0.5">Standard</span>
                                </button>
                                <button type="button" onclick="selectBatteryPreset(15)" class="battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-slate-600 text-slate-400 hover:border-amber-500/50" data-kwh="15">
                                    <span class="block font-medium">15 kWh</span>
                                    <span class="block text-[11px] text-slate-500 mt-0.5">Grand</span>
                                </button>
                            </div>
                            <p class="text-[12px] text-slate-500">Le co&#xFB;t est estim&#xe9; automatiquement &#xe0; partir de la moyenne pays.</p>
                            <details>
                                <summary class="text-[12px] text-amber-400/70 hover:text-amber-400 cursor-pointer">Ajuster la capacit&#xe9; et le co&#xFB;t</summary>
                                <div class="mt-3 grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-[13px] text-slate-300 mb-1 block font-medium">Capacit&#xe9; (kWh)</label>
                                        <input type="number" id="resBatteryCapacity" min="1" max="100" step="0.5" value="10" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm">
                                    </div>
                                    <div>
                                        <label class="text-[13px] text-slate-300 mb-1 block font-medium">Co&#xFB;t (<span class="cur">&#x20AC;</span>)</label>
                                        <input type="number" id="resBatteryCostOverride" placeholder="Vide = moyenne pays" min="0" max="100000" step="100" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-600">
                                        <p class="text-xs text-amber-400/70 mt-1">Moyenne : <span id="resAvgBatteryCostHint" class="font-semibold text-amber-400">&#x2014;</span> <span class="cur">&#x20AC;</span>/kWh</p>
                                    </div>
                                </div>
                            </details>
                        </div>
'''

NEW_PV_EN = '''                    <!-- Lot 7: Surface + estimated power -->
                    <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
                        <h4 class="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                            <span class="text-amber-500">&#x25CF;</span> Your installation
                        </h4>
                        <div class="space-y-4">
                            <div>
                                <label class="text-[13px] text-slate-300 mb-1 block font-medium">Available roof area (m&#xB2;)</label>
                                <input type="number" id="resSurfaceSimple" value="30" min="5" max="1000" step="1" oninput="updateKwcFromSurface()" class="w-full max-w-xs px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm">
                                <p class="mt-1 text-[13px] text-slate-500">Roughly 6 m&#xB2; per kWp installed.</p>
                            </div>
                            <div class="p-3 bg-slate-800/60 rounded-lg border border-slate-700/40">
                                <p class="text-[13px] text-slate-400">Estimated power: <span id="kwcEstimate" class="text-amber-400 font-semibold">5.1 kWp</span></p>
                                <p class="text-[11px] text-slate-500 mt-1">Based on roof area and monocrystalline panels (20%). Adjustable in advanced settings.</p>
                            </div>
                            <details id="manualKwcOverride">
                                <summary class="text-[12px] text-amber-400/70 hover:text-amber-400 cursor-pointer">I have a quote: enter exact power</summary>
                                <div class="mt-2">
                                    <input type="number" id="simPeakpower" min="0.5" max="100" step="0.1" value="5.1" oninput="onManualKwcChange()" class="w-full max-w-xs px-3 py-2 bg-slate-800 border border-amber-500/50 rounded-lg text-amber-300 text-sm font-medium">
                                </div>
                            </details>
                        </div>
                    </div>

'''

NEW_BAT_EN = '''                        <div id="batteryCapacitySection" style="display:none" class="space-y-3">
                            <div class="flex gap-2">
                                <button type="button" onclick="selectBatteryPreset(5)" class="battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-slate-600 text-slate-400 hover:border-amber-500/50" data-kwh="5">
                                    <span class="block font-medium">5 kWh</span>
                                    <span class="block text-[11px] text-slate-500 mt-0.5">Small</span>
                                </button>
                                <button type="button" onclick="selectBatteryPreset(10)" class="battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-amber-500/50 text-amber-300 bg-amber-500/10" data-kwh="10">
                                    <span class="block font-medium">10 kWh</span>
                                    <span class="block text-[11px] text-amber-400/60 mt-0.5">Standard</span>
                                </button>
                                <button type="button" onclick="selectBatteryPreset(15)" class="battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-slate-600 text-slate-400 hover:border-amber-500/50" data-kwh="15">
                                    <span class="block font-medium">15 kWh</span>
                                    <span class="block text-[11px] text-slate-500 mt-0.5">Large</span>
                                </button>
                            </div>
                            <p class="text-[12px] text-slate-500">Cost is estimated automatically from the country average.</p>
                            <details>
                                <summary class="text-[12px] text-amber-400/70 hover:text-amber-400 cursor-pointer">Adjust capacity and cost</summary>
                                <div class="mt-3 grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-[13px] text-slate-300 mb-1 block font-medium">Capacity (kWh)</label>
                                        <input type="number" id="resBatteryCapacity" min="1" max="100" step="0.5" value="10" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm">
                                    </div>
                                    <div>
                                        <label class="text-[13px] text-slate-300 mb-1 block font-medium">Cost (<span class="cur">&#x20AC;</span>)</label>
                                        <input type="number" id="resBatteryCostOverride" placeholder="Empty = country avg" min="0" max="100000" step="100" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-600">
                                        <p class="text-xs text-amber-400/70 mt-1">Average: <span id="resAvgBatteryCostHint" class="font-semibold text-amber-400">&#x2014;</span> <span class="cur">&#x20AC;</span>/kWh</p>
                                    </div>
                                </div>
                            </details>
                        </div>
'''

JS_LOT7 = """
        // --- Lot 7: Simple mode helpers ---
        function updateKwcFromSurface() {
            var surface = parseFloat(document.getElementById('resSurfaceSimple').value) || 30;
            var panelEff = parseFloat(document.getElementById('resPanelType').value) || 0.20;
            var kwc = (surface * 0.85 * panelEff).toFixed(1);
            document.getElementById('simPeakpower').value = kwc;
            var unit = document.documentElement.lang === 'en' ? ' kWp' : ' kWc';
            document.getElementById('kwcEstimate').textContent = kwc + unit;
            document.getElementById('resSurface').value = surface;
        }

        function onManualKwcChange() {
            var kwc = parseFloat(document.getElementById('simPeakpower').value) || 0;
            var unit = document.documentElement.lang === 'en' ? ' kWp' : ' kWc';
            document.getElementById('kwcEstimate').textContent = kwc.toFixed(1) + unit;
        }

        function selectBatteryPreset(kwh) {
            document.getElementById('resBatteryCapacity').value = kwh;
            document.querySelectorAll('.battery-preset').forEach(function(btn) {
                var isActive = parseInt(btn.getAttribute('data-kwh')) === kwh;
                if (isActive) {
                    btn.className = 'battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-amber-500/50 text-amber-300 bg-amber-500/10';
                } else {
                    btn.className = 'battery-preset flex-1 py-2.5 rounded-lg border text-center text-sm transition-all border-slate-600 text-slate-400 hover:border-amber-500/50';
                }
                var sub = btn.querySelectorAll('span')[1];
                if (sub) sub.className = 'block text-[11px] mt-0.5 ' + (isActive ? 'text-amber-400/60' : 'text-slate-500');
            });
        }
        // --- End Lot 7 ---

"""

def apply_file(filepath, new_pv, new_bat, lang):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'resSurfaceSimple' in content:
        print(f'  [SKIP] {filepath} - Lot 7 already applied')
        return False

    errors = []

    # 1. Replace PV card: from "<!-- Puissance PV -->" to "<!-- Batterie"
    #    or from "<!-- CARD 3: PV Power" to "<!-- CARD" for EN
    if lang == 'fr':
        pv_start_marker = '<!-- Puissance PV -->'
        pv_end_marker = '<!-- Batterie -->'
    else:
        pv_start_marker = '<!-- CARD 3: PV Power'
        pv_end_marker = '<!-- CARD 5: Battery'
        # Check if EN uses different markers
        if pv_end_marker not in content:
            pv_end_marker = '<!-- CARD 5:'
        if pv_end_marker not in content:
            # Try simpler
            pv_end_marker = 'Battery Storage'

    pv_s = content.find(pv_start_marker)
    pv_e = content.find(pv_end_marker, pv_s + 1) if pv_s != -1 else -1
    if pv_s == -1 or pv_e == -1:
        errors.append(f'PV card markers not found (start={pv_s}, end={pv_e})')
    else:
        pv_line_start = content.rfind('\n', 0, pv_s) + 1
        pv_line_end = content.rfind('\n', 0, pv_e) + 1
        content = content[:pv_line_start] + new_pv + content[pv_line_end:]

    # 2. Replace battery section
    bat_old_start = 'id="batteryCapacitySection"'
    bat_s = content.find(bat_old_start)
    if bat_s == -1:
        errors.append('batteryCapacitySection not found')
    else:
        # Find start of the <div line
        div_start = content.rfind('<div', 0, bat_s + len(bat_old_start))
        line_start = content.rfind('\n', 0, div_start) + 1
        # Find the closing </div> — count nesting from the opening <div
        depth = 0
        i = div_start
        end_idx = -1
        while i < len(content):
            if content[i:i+4] == '<div':
                depth += 1
            elif content[i:i+6] == '</div>':
                depth -= 1
                if depth == 0:
                    end_idx = i + 6
                    break
            i += 1
        if end_idx == -1:
            errors.append('Could not find closing </div> for batteryCapacitySection')
        else:
            # Consume trailing newline
            if end_idx < len(content) and content[end_idx] == '\n':
                end_idx += 1
            content = content[:line_start] + new_bat + content[end_idx:]

    # 3. toggleBatteryCapacity: 'grid' -> 'block'
    old_toggle = "section.style.display = toggle ? 'grid' : 'none';"
    if old_toggle in content:
        content = content.replace(old_toggle, "section.style.display = toggle ? 'block' : 'none';", 1)

    # 4. Patch updateKwc() to sync resSurfaceSimple
    old_ukwc = "document.getElementById('simPeakpower').value = kwc;\n        }"
    unit = "' kWp'" if lang == 'en' else "' kWc'"
    new_ukwc = "document.getElementById('simPeakpower').value = kwc;\n" + \
               "            var el = document.getElementById('resSurfaceSimple');\n" + \
               "            if (el) el.value = surface;\n" + \
               "            var est = document.getElementById('kwcEstimate');\n" + \
               "            if (est) est.textContent = kwc + " + unit + ";\n" + \
               "        }"
    if old_ukwc in content:
        content = content.replace(old_ukwc, new_ukwc, 1)
    else:
        errors.append('updateKwc sync marker not found')

    # 5. Add JS functions before toggleAdvancedFields
    ta_marker = '        function toggleAdvancedFields() {'
    if ta_marker in content:
        content = content.replace(ta_marker, JS_LOT7 + ta_marker, 1)
    else:
        errors.append('toggleAdvancedFields marker not found')

    # 6. Patch resetForm
    old_reset = "document.getElementById('resSurface').value = '30';"
    unit_label = '5.1 kWp' if lang == 'en' else '5.1 kWc'
    new_reset = old_reset + "\n" + \
        "            if (document.getElementById('resSurfaceSimple')) document.getElementById('resSurfaceSimple').value = '30';\n" + \
        "            if (document.getElementById('kwcEstimate')) document.getElementById('kwcEstimate').textContent = '" + unit_label + "';\n" + \
        "            if (typeof selectBatteryPreset === 'function') selectBatteryPreset(10);"
    if old_reset in content:
        content = content.replace(old_reset, new_reset, 1)

    if errors:
        for e in errors:
            print(f'  [ERROR] {filepath}: {e}')
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  [OK] {filepath}')
    return True


if __name__ == '__main__':
    base = os.path.dirname(os.path.abspath(__file__))
    fr = os.path.join(base, 'fr', 'outils-simulation.html')
    en = os.path.join(base, 'en', 'tools-simulation.html')
    print('=== Lot 7: Simple mode UX ===')
    ok_fr = apply_file(fr, NEW_PV_FR, NEW_BAT_FR, 'fr')
    ok_en = apply_file(en, NEW_PV_EN, NEW_BAT_EN, 'en')
    if ok_fr or ok_en:
        print('\nDone. Verify:')
        print('  grep -c "resSurfaceSimple" fr/outils-simulation.html en/tools-simulation.html')
        print('  grep -c "battery-preset" fr/outils-simulation.html en/tools-simulation.html')
    else:
        print('\nNo changes made.')
