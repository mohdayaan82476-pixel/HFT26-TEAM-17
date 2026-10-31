import os
import sys
import time
import subprocess
import json
import urllib.request
import socket
import base64
from urllib.parse import urlparse

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "http://127.0.0.1:8080/index.html"
DEBUG_PORT = 9245

cmd = [
    CHROME_PATH,
    "--headless=new",
    f"--remote-debugging-port={DEBUG_PORT}",
    "--window-size=1280,720",
    "--disable-gpu",
    "--no-sandbox",
    URL
]

print("Starting headless Chrome on port", DEBUG_PORT)
proc = subprocess.Popen(cmd)
time.sleep(3.0)

try:
    req = urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json")
    tabs = json.loads(req.read().decode('utf-8'))
    ws_url = None
    for tab in tabs:
        if tab.get("type") == "page" and "index.html" in tab.get("url", ""):
            ws_url = tab.get("webSocketDebuggerUrl")
            break
    if not ws_url:
        for tab in tabs:
            if tab.get("type") == "page":
                ws_url = tab.get("webSocketDebuggerUrl")
                break

    print(f"Connecting to CDP: {ws_url}")
    u = urlparse(ws_url)
    s = socket.create_connection((u.hostname, u.port), timeout=15)
    key = base64.b64encode(b"1234567890123456").decode()
    handshake = (
        f"GET {u.path} HTTP/1.1\r\n"
        f"Host: {u.hostname}:{u.port}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(handshake.encode())
    s.recv(4096)

    msg_counter = 1
    def send_cdp(method, params={}):
        global msg_counter
        mid = msg_counter
        msg_counter += 1
        payload = json.dumps({"id": mid, "method": method, "params": params}).encode()
        mask = b"1234"
        masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
        if len(payload) < 126:
            frame = bytearray([0x81, 0x80 | len(payload)])
        else:
            frame = bytearray([0x81, 0x80 | 126]) + len(payload).to_bytes(2, "big")
        s.sendall(frame + mask + masked)
        return mid

    def recv_msg():
        while True:
            header = s.recv(2)
            if not header or len(header) < 2:
                return None
            b1, b2 = header[0], header[1]
            payload_len = b2 & 0x7F
            if payload_len == 126:
                ext = s.recv(2)
                payload_len = int.from_bytes(ext, 'big')
            elif payload_len == 127:
                ext = s.recv(8)
                payload_len = int.from_bytes(ext, 'big')

            data = bytearray()
            while len(data) < payload_len:
                chunk = s.recv(payload_len - len(data))
                if not chunk:
                    break
                data.extend(chunk)
            
            try:
                msg = json.loads(data.decode('utf-8'))
                return msg
            except Exception:
                continue

    def eval_js(expr):
        mid = send_cdp("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
        while True:
            m = recv_msg()
            if m and m.get("id") == mid:
                res = m.get("result", {})
                if "exceptionDetails" in res:
                    print("JS EXCEPTION:", res["exceptionDetails"])
                return res.get("result", {}).get("value")

    def capture_screenshot(path):
        mid = send_cdp("Page.captureScreenshot", {"format": "png"})
        while True:
            m = recv_msg()
            if m and m.get("id") == mid:
                b64 = m.get("result", {}).get("data")
                if b64:
                    with open(path, "wb") as f:
                        f.write(base64.b64decode(b64))
                    print(f"Captured screenshot: {path}")
                return

    send_cdp("Runtime.enable")
    send_cdp("Page.enable")

    print("Waiting for Game initialization...")
    ready = False
    for _ in range(40):
        time.sleep(0.5)
        ready = eval_js("Boolean(window.gameInstance && window.gameInstance.activePlanetGroup && window.gameInstance.playerAstronaut)")
        if ready:
            print("Game instance ready!")
            break

    assert ready, "Game failed to initialize within 20 seconds"

    # ── TEST 1: Initial Earth Atmosphere HUD ─────────────────────────────
    print("\n--- TEST 1: Earth Atmosphere HUD Verification ---")
    earth_atmo = eval_js("""
        (() => {
            const name = document.getElementById('hud-planet-name')?.textContent;
            const type = document.getElementById('hud-planet-type')?.textContent;
            const n2 = document.getElementById('hud-n2-val')?.textContent;
            const o2 = document.getElementById('hud-o2-val')?.textContent;
            const co2 = document.getElementById('hud-co2-val')?.textContent;
            const pressure = document.getElementById('hud-pressure-val')?.textContent;
            const temp = document.getElementById('hud-temp-val')?.textContent;
            const breathText = document.getElementById('hud-breathability')?.textContent;
            const breathClass = document.getElementById('hud-breathability')?.className;
            const fillN2 = document.querySelector('.fill-n2')?.style.width;
            const fillO2 = document.querySelector('.fill-o2')?.style.width;
            const fillCo2 = document.querySelector('.fill-co2')?.style.width;
            return { name, type, n2, o2, co2, pressure, temp, breathText, breathClass, fillN2, fillO2, fillCo2 };
        })()
    """)
    print(f"Earth HUD: {earth_atmo}")
    assert "Earth" in earth_atmo["name"], f"Expected Earth, got {earth_atmo['name']}"
    assert "78" in earth_atmo["n2"], f"Expected 78% N2, got {earth_atmo['n2']}"
    assert "20" in earth_atmo["o2"] or "21" in earth_atmo["o2"], f"Expected ~21% O2, got {earth_atmo['o2']}"
    assert "Breathable" in earth_atmo["breathText"], f"Expected Breathable badge, got {earth_atmo['breathText']}"
    assert "78" in earth_atmo["fillN2"], f"Expected .fill-n2 width 78%, got {earth_atmo['fillN2']}"
    print("✅ TEST 1 PASSED: Initial Earth Atmosphere HUD & dynamic bars correct.")

    # ── TEST 2: First Interaction with Professor Spike on Earth ───────────
    print("\n--- TEST 2: First Interaction with Professor Spike on Earth ---")
    eval_js("""
        (() => {
            const teacherObj = window.game.earthGroup.userData.interactables.find(i => i.type === 'TEACHER');
            window.game.activeInteractable = teacherObj;
            window.game.triggerInteraction();
        })()
    """)

    earth_dialog = None
    for _ in range(30):
        time.sleep(0.2)
        earth_dialog = eval_js("""
            (() => {
                const modal = document.getElementById('teacher-dialogue-modal');
                const isVisible = !modal.classList.contains('hidden');
                const text = document.getElementById('teacher-dialogue-text')?.textContent;
                const fullText = document.getElementById('teacher-dialogue-text')?.dataset.fullText;
                return { isVisible, text, fullText };
            })()
        """)
        if earth_dialog and (earth_dialog.get("fullText") or (earth_dialog.get("text") and len(earth_dialog["text"]) > 10)):
            break

    print(f"Earth Debriefing Dialog: {earth_dialog}")
    combined_text = (earth_dialog.get("fullText") or "") + " " + (earth_dialog.get("text") or "")
    assert earth_dialog["isVisible"], "Teacher dialog should be open on interaction"
    assert "Earth" in combined_text or "Musculoskeletal" in combined_text or "1.0g" in combined_text, f"Unexpected text: {combined_text}"

    # Check dashboard table on Earth
    has_earth_dashboard = eval_js("Boolean(document.querySelector('.comparison-dashboard') && document.querySelector('.dashboard-table'))")
    earth_score = eval_js("document.querySelector('.score-number')?.textContent")
    print(f"Earth Dashboard: has_table={has_earth_dashboard}, score={earth_score}")
    assert has_earth_dashboard, "Earth first interaction should show comparison dashboard table!"
    assert "100%" in earth_score, f"Expected 100% on Earth, got {earth_score}"
    print("✅ TEST 2 PASSED: First interaction delivers Earth comparison dashboard table.")

    # Close dialog
    eval_js("document.getElementById('teacher-dialogue-modal').classList.add('hidden')")

    # ── TEST 3: Galaxy Map From Earth to Exoplanet ───────────────────────
    print("\n--- TEST 3: Galaxy Map Distance from Earth ---")
    eval_js("window.game.openGalaxyMap()")
    time.sleep(0.5)

    # Select TRAPPIST-1 e
    eval_js("window.game.universeMap.selectPlanetByName('TRAPPIST-1 e')")
    eval_js("window.game.displayPlanetInspector(window.game.universeMap.selectedPlanet)")

    earth_to_trappist = eval_js("""
        (() => {
            const origin = document.getElementById('caliper-origin')?.textContent;
            const target = document.getElementById('caliper-target-name')?.textContent;
            const distVal = document.getElementById('caliper-dist-value')?.textContent;
            const inspectDist = document.getElementById('inspect-distance')?.textContent;
            const warpBtnText = document.getElementById('engage-warp-btn')?.textContent;
            return { origin, target, distVal, inspectDist, warpBtnText };
        })()
    """)
    print(f"Earth to TRAPPIST-1 e: {earth_to_trappist}")
    assert "Earth" in earth_to_trappist["origin"], f"Expected Earth origin, got {earth_to_trappist['origin']}"
    assert "TRAPPIST-1 e" in earth_to_trappist["target"], f"Expected TRAPPIST-1 e target, got {earth_to_trappist['target']}"
    assert "39.5" in earth_to_trappist["distVal"], f"Expected 39.5 LY, got {earth_to_trappist['distVal']}"
    assert "39.5" in earth_to_trappist["inspectDist"], f"Expected 39.5 LY in inspector, got {earth_to_trappist['inspectDist']}"
    print("✅ TEST 3 PASSED: Distance from Earth correctly measured and displayed.")

    # ── TEST 4: Warp & Touchdown on TRAPPIST-1 e ─────────────────────────
    print("\n--- TEST 4: Warp & Touchdown on TRAPPIST-1 e ---")
    eval_js("""
        (() => {
            const pl = window.game.universeMap.selectedPlanet;
            window.game.initiateOrbitalApproach(pl);
        })()
    """)
    time.sleep(0.5)

    gold_hud = eval_js("""
        (() => {
            const name = document.getElementById('gold-pl-name')?.textContent;
            const verdict = document.getElementById('goldilocks-verdict-banner')?.textContent;
            return { name, verdict };
        })()
    """)
    print(f"Orbital Telemetry: {gold_hud}")
    assert "TRAPPIST-1 e" in gold_hud["name"], f"Expected TRAPPIST-1 e, got {gold_hud['name']}"
    assert "GOLDILOCKS" in gold_hud["verdict"], f"Expected GOLDILOCKS, got {gold_hud['verdict']}"

    # Initiate descent
    eval_js("window.game.initiateAtmosphericEntry()")
    time.sleep(0.5)

    entry_hud = eval_js("""
        (() => {
            const n2 = document.getElementById('entry-atmo-n2')?.textContent;
            const o2 = document.getElementById('entry-atmo-o2')?.textContent;
            const co2 = document.getElementById('entry-atmo-co2')?.textContent;
            return { n2, o2, co2 };
        })()
    """)
    print(f"Entry Telemetry: {entry_hud}")

    # Complete Landing onto TRAPPIST-1 e
    eval_js("window.game.completeLanding()")
    time.sleep(1.0)

    # Verify TRAPPIST-1 e atmosphere HUD & progress bars
    trappist_atmo = eval_js("""
        (() => {
            const name = document.getElementById('hud-planet-name')?.textContent;
            const type = document.getElementById('hud-planet-type')?.textContent;
            const n2 = document.getElementById('hud-n2-val')?.textContent;
            const o2 = document.getElementById('hud-o2-val')?.textContent;
            const co2 = document.getElementById('hud-co2-val')?.textContent;
            const pressure = document.getElementById('hud-pressure-val')?.textContent;
            const temp = document.getElementById('hud-temp-val')?.textContent;
            const breathText = document.getElementById('hud-breathability')?.textContent;
            const breathClass = document.getElementById('hud-breathability')?.className;
            const fillN2 = document.querySelector('.fill-n2')?.style.width;
            const fillO2 = document.querySelector('.fill-o2')?.style.width;
            const fillCo2 = document.querySelector('.fill-co2')?.style.width;
            const isTeacherOpen = !document.getElementById('teacher-dialogue-modal').classList.contains('hidden');
            return { name, type, n2, o2, co2, pressure, temp, breathText, breathClass, fillN2, fillO2, fillCo2, isTeacherOpen };
        })()
    """)
    print(f"TRAPPIST-1 e HUD: {trappist_atmo}")
    assert "TRAPPIST-1 e" in trappist_atmo["name"], f"Expected TRAPPIST-1 e, got {trappist_atmo['name']}"
    assert "72" in trappist_atmo["n2"], f"Expected 72% N2, got {trappist_atmo['n2']}"
    assert "18" in trappist_atmo["o2"], f"Expected 18% O2, got {trappist_atmo['o2']}"
    assert "72" in trappist_atmo["fillN2"], f"Expected .fill-n2 ~72%, got {trappist_atmo['fillN2']}"
    assert not trappist_atmo["isTeacherOpen"], "Teacher dialog should NOT auto-open on touchdown"
    print("✅ TEST 4 PASSED: Atmosphere HUD & dynamic bars updated for TRAPPIST-1 e, dialog waits for interact.")

    # ── TEST 5: First Interaction on TRAPPIST-1 e: Human Compatibility Debriefing ─
    print("\n--- TEST 5: First Interaction with Professor Spike on TRAPPIST-1 e ---")
    eval_js("""
        (() => {
            const teacherObj = window.game.activePlanetGroup.userData.interactables.find(i => i.type === 'TEACHER');
            window.game.activeInteractable = teacherObj;
            window.game.triggerInteraction();
        })()
    """)

    trappist_briefing = None
    for _ in range(45):
        time.sleep(0.3)
        trappist_briefing = eval_js("""
            (() => {
                const modal = document.getElementById('teacher-dialogue-modal');
                const isVisible = !modal.classList.contains('hidden');
                const text = document.getElementById('teacher-dialogue-text')?.textContent;
                const fullText = document.getElementById('teacher-dialogue-text')?.dataset.fullText;
                return { isVisible, text, fullText };
            })()
        """)
        if trappist_briefing and trappist_briefing.get("fullText") and "TRAPPIST-1 e" in trappist_briefing["fullText"]:
            break

    combined_trappist = (trappist_briefing.get("fullText") or "") + " " + (trappist_briefing.get("text") or "")
    print(f"TRAPPIST-1 e Debriefing Text:\n{combined_trappist}")
    assert trappist_briefing["isVisible"], "Teacher modal should open on interact [E]"
    assert "TRAPPIST-1 e" in combined_trappist, "Debriefing should mention TRAPPIST-1 e"
    assert "Earth" in combined_trappist, "Debriefing should compare against Earth baseline"
    assert "Musculoskeletal" in combined_trappist or "Gravity" in combined_trappist or "gravity" in combined_trappist, "Should discuss gravity"
    assert "Human Compatibility" in combined_trappist, "Should have Human Compatibility rating"

    # Verify Dashboard Table structure
    has_trappist_dashboard = eval_js("Boolean(document.querySelector('.comparison-dashboard') && document.querySelector('.dashboard-table'))")
    trappist_score = eval_js("document.querySelector('.score-number')?.textContent")
    trappist_rows = eval_js("document.querySelectorAll('.dashboard-table tbody tr').length")
    print(f"TRAPPIST-1 e Dashboard: has_table={has_trappist_dashboard}, score={trappist_score}, rows={trappist_rows}")
    assert has_trappist_dashboard, "TRAPPIST-1 e first interaction should display comparison dashboard table!"
    assert trappist_rows == 4, f"Dashboard table should contain 4 factor rows, found {trappist_rows}"
    assert "78%" in trappist_score, f"Expected 78% on TRAPPIST-1 e, got {trappist_score}"
    print("✅ TEST 5 PASSED: Planetary comparison dashboard table generated and rendered on first interact.")

    # Capture screenshot of the comparison dashboard table modal
    capture_screenshot("C:/Users/sachin/.gemini/antigravity/brain/82bc2f42-54d0-40ab-bf80-9ddff7843d34/test_comparison_dashboard.png")

    # Close dialog and test second interaction on same world
    eval_js("document.getElementById('teacher-dialogue-modal').classList.add('hidden')")
    eval_js("""
        (() => {
            const teacherObj = window.game.activePlanetGroup.userData.interactables.find(i => i.type === 'TEACHER');
            window.game.activeInteractable = teacherObj;
            window.game.triggerInteraction();
        })()
    """)
    time.sleep(0.5)

    second_briefing = eval_js("""
        (() => {
            const el = document.getElementById('teacher-dialogue-text');
            return el?.dataset.fullText || el?.textContent;
        })()
    """)
    print(f"Subsequent interaction text: {second_briefing}")
    assert ("little cadet" in second_briefing or "space berries" in second_briefing or "Welcome back" in second_briefing), "Subsequent interaction should give child-friendly welcome"
    print("✅ TEST 5.1 PASSED: Subsequent interaction gives cheerful child-friendly greeting.")

    # ── TEST 5.2: Child-Friendly (ELI5) Quick Questions & Dashboard Reopen ───
    print("\n--- TEST 5.2: Child-Friendly Quick Questions & Dashboard Reopen ---")

    # 1. Ask about farming
    farm_reply = eval_js("""
        (async () => {
            await window.game.handleTeacherQuestion("Can we grow edible crops or farm here?");
            return document.getElementById('teacher-dialogue-text')?.dataset.fullText || document.getElementById('teacher-dialogue-text')?.textContent;
        })()
    """)
    print(f"Farming (ELI5) Reply: {farm_reply}")
    assert any(w in farm_reply.lower() for w in ["veggie", "picnic", "strawberr", "plant", "seed", "sprout", "garden"]), f"Expected child-friendly farming words, got: {farm_reply}"

    # 2. Ask about mining
    mine_reply = eval_js("""
        (async () => {
            await window.game.handleTeacherQuestion("What minerals can our mining drill extract?");
            return document.getElementById('teacher-dialogue-text')?.dataset.fullText || document.getElementById('teacher-dialogue-text')?.textContent;
        })()
    """)
    print(f"Mining (ELI5) Reply: {mine_reply}")
    assert any(w in mine_reply.lower() for w in ["treasure", "shiny", "metal", "truck", "drill", "pebble", "rock"]), f"Expected child-friendly mining words, got: {mine_reply}"

    # 3. Ask about safety
    safe_reply = eval_js("""
        (async () => {
            await window.game.handleTeacherQuestion("Is it safe to step out of the ship?");
            return document.getElementById('teacher-dialogue-text')?.dataset.fullText || document.getElementById('teacher-dialogue-text')?.textContent;
        })()
    """)
    print(f"Safety (ELI5) Reply: {safe_reply}")
    assert any(w in safe_reply.lower() for w in ["superhero", "spacesuit", "costume", "safe", "cozy", "helmet"]), f"Expected child-friendly safety words, got: {safe_reply}"

    # 4. Reopen Comparison Dashboard via button click
    eval_js("""
        (() => {
            const btn = document.getElementById('show-comparison-dashboard-btn');
            btn.click();
        })()
    """)
    reopened_table = False
    for _ in range(15):
        time.sleep(0.2)
        reopened_table = eval_js("Boolean(document.querySelector('.comparison-dashboard') && document.querySelector('.dashboard-table'))")
        if reopened_table:
            break
    assert reopened_table, "Clicking '📊 Planet Table' button should re-render the comparison dashboard table!"
    print("✅ TEST 5.2 PASSED: All quick answers are child-friendly (ELI5) and dashboard table reopens on demand.")

    eval_js("document.getElementById('teacher-dialogue-modal').classList.add('hidden')")

    # ── TEST 6: Galaxy Map from TRAPPIST-1 e to Another Exoplanet & Earth ──
    print("\n--- TEST 6: Galaxy Map Distance from TRAPPIST-1 e to Kepler-452 b & Earth ---")
    eval_js("window.game.openGalaxyMap()")
    time.sleep(0.5)

    # Select Kepler-452 b
    eval_js("window.game.universeMap.selectPlanetByName('Kepler-452 b')")
    eval_js("window.game.displayPlanetInspector(window.game.universeMap.selectedPlanet)")

    trappist_to_kepler = eval_js("""
        (() => {
            const origin = document.getElementById('caliper-origin')?.textContent;
            const target = document.getElementById('caliper-target-name')?.textContent;
            const distVal = document.getElementById('caliper-dist-value')?.textContent;
            const inspectDist = document.getElementById('inspect-distance')?.textContent;
            return { origin, target, distVal, inspectDist };
        })()
    """)
    print(f"TRAPPIST-1 e to Kepler-452 b: {trappist_to_kepler}")
    assert "TRAPPIST-1 e" in trappist_to_kepler["origin"], f"Expected TRAPPIST-1 e origin, got {trappist_to_kepler['origin']}"
    assert "Kepler-452 b" in trappist_to_kepler["target"], f"Expected Kepler-452 b target, got {trappist_to_kepler['target']}"
    assert "Light-Years" in trappist_to_kepler["distVal"], f"Expected distance in LY, got {trappist_to_kepler['distVal']}"
    assert "from TRAPPIST-1 e" in trappist_to_kepler["inspectDist"], f"Expected relative distance, got {trappist_to_kepler['inspectDist']}"
    print("✅ TEST 6.1 PASSED: Exoplanet-to-exoplanet relative distance computed and displayed.")

    # Select Earth to return
    eval_js("window.game.universeMap.selectPlanetByName('Earth')")
    eval_js("window.game.displayPlanetInspector(window.game.universeMap.selectedPlanet)")

    trappist_to_earth = eval_js("""
        (() => {
            const origin = document.getElementById('caliper-origin')?.textContent;
            const target = document.getElementById('caliper-target-name')?.textContent;
            const distVal = document.getElementById('caliper-dist-value')?.textContent;
            const inspectDist = document.getElementById('inspect-distance')?.textContent;
            const warpBtn = document.getElementById('engage-warp-btn')?.textContent;
            return { origin, target, distVal, inspectDist, warpBtn };
        })()
    """)
    print(f"TRAPPIST-1 e to Earth: {trappist_to_earth}")
    assert "TRAPPIST-1 e" in trappist_to_earth["origin"], f"Expected TRAPPIST-1 e origin, got {trappist_to_earth['origin']}"
    assert "Earth" in trappist_to_earth["target"], f"Expected Earth target, got {trappist_to_earth['target']}"
    assert "39.5" in trappist_to_earth["distVal"], f"Expected 39.5 LY, got {trappist_to_earth['distVal']}"
    assert "RETURN TO EARTH" in trappist_to_earth["warpBtn"], f"Expected RETURN TO EARTH button, got {trappist_to_earth['warpBtn']}"
    print("✅ TEST 6.2 PASSED: Earth selectable from exoplanet with return warp option.")

    # ── TEST 7: Return to Earth: Warp, Descent, and Landing ─────────────
    print("\n--- TEST 7: Return to Earth: Warp, Descent, and Landing ---")
    eval_js("""
        (() => {
            const pl = window.game.universeMap.selectedPlanet;
            window.game.initiateOrbitalApproach(pl);
        })()
    """)
    time.sleep(0.5)

    earth_orbital = eval_js("""
        (() => {
            const name = document.getElementById('gold-pl-name')?.textContent;
            const verdict = document.getElementById('goldilocks-verdict-banner')?.textContent;
            const descentBtn = document.getElementById('start-descent-btn')?.textContent;
            return { name, verdict, descentBtn };
        })()
    """)
    print(f"Earth Orbital Telemetry: {earth_orbital}")
    assert "Earth" in earth_orbital["name"], f"Expected Earth, got {earth_orbital['name']}"
    assert "HOMEWORLD" in earth_orbital["verdict"] or "Compatibility" in earth_orbital["verdict"], f"Expected homeworld verdict, got {earth_orbital['verdict']}"

    # Initiate descent to Earth
    eval_js("window.game.initiateAtmosphericEntry()")
    time.sleep(0.5)

    # Complete Landing back on Earth
    eval_js("window.game.completeLanding()")
    time.sleep(1.0)

    # Verify Atmosphere HUD is back to Earth
    return_earth_atmo = eval_js("""
        (() => {
            const name = document.getElementById('hud-planet-name')?.textContent;
            const type = document.getElementById('hud-planet-type')?.textContent;
            const n2 = document.getElementById('hud-n2-val')?.textContent;
            const o2 = document.getElementById('hud-o2-val')?.textContent;
            const co2 = document.getElementById('hud-co2-val')?.textContent;
            const pressure = document.getElementById('hud-pressure-val')?.textContent;
            const temp = document.getElementById('hud-temp-val')?.textContent;
            const breathText = document.getElementById('hud-breathability')?.textContent;
            const breathClass = document.getElementById('hud-breathability')?.className;
            const fillN2 = document.querySelector('.fill-n2')?.style.width;
            const fillO2 = document.querySelector('.fill-o2')?.style.width;
            const fillCo2 = document.querySelector('.fill-co2')?.style.width;
            const gameState = window.game.currentState;
            return { name, type, n2, o2, co2, pressure, temp, breathText, breathClass, fillN2, fillO2, fillCo2, gameState };
        })()
    """)
    print(f"Landed back on Earth HUD: {return_earth_atmo}")
    assert "Earth" in return_earth_atmo["name"], f"Expected Earth, got {return_earth_atmo['name']}"
    assert "78" in return_earth_atmo["n2"], f"Expected 78% N2, got {return_earth_atmo['n2']}"
    assert "20" in return_earth_atmo["o2"] or "21" in return_earth_atmo["o2"], f"Expected ~21% O2, got {return_earth_atmo['o2']}"
    assert "Breathable" in return_earth_atmo["breathText"], f"Expected Breathable badge, got {return_earth_atmo['breathText']}"
    assert "EARTH_TUTORIAL" in return_earth_atmo["gameState"], f"Expected EARTH_TUTORIAL, got {return_earth_atmo['gameState']}"
    print("✅ TEST 7 PASSED: Landed cleanly back on Earth with full Earth atmospheric restoration.")

    # Capture screenshot
    capture_screenshot("C:/Users/sachin/.gemini/antigravity/brain/82bc2f42-54d0-40ab-bf80-9ddff7843d34/test_return_earth_hud.png")

    print("\n🎉 ALL 7 SYSTEM TESTS PASSED SUCCESSFULLY!")

finally:
    try:
        s.close()
    except Exception:
        pass
    proc.terminate()
