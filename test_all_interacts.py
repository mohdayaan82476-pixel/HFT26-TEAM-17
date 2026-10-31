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
DEBUG_PORT = 9242

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
        if "index.html" in tab.get("url", ""):
            ws_url = tab.get("webSocketDebuggerUrl")
            break
    if not ws_url and len(tabs) > 0:
        ws_url = tabs[0].get("webSocketDebuggerUrl")

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
                    print(f"Screenshot saved: {path}")
                return

    # Wait for game to initialize
    print("\nWaiting for game initialization...")
    current_state = None
    for _ in range(40):
        current_state = eval_js("(window.game || window.gameInstance)?.currentState || null")
        if current_state:
            eval_js("window.game = window.game || window.gameInstance;")
            break
        time.sleep(0.5)
    print(f"1. Current Game State: {current_state}")
    assert current_state == "EARTH_TUTORIAL", f"Expected EARTH_TUTORIAL, got {current_state}"

    # Register helper for smooth position testing
    eval_js("""
      window.moveToInteractable = function(type, offsetDist = 2.5) {
        const item = window.game.activePlanetGroup.userData.interactables.find(i => i.type === type);
        if (!item) return false;
        const up = item.position.clone().normalize();
        const helper = Math.abs(up.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const tangent = new THREE.Vector3().crossVectors(up, helper).normalize();
        const targetPos = item.position.clone().addScaledVector(tangent, offsetDist);
        targetPos.normalize().multiplyScalar(window.game.activePlanetGroup.userData.radius + 0.1);
        window.game.playerAstronaut.position.copy(targetPos);
        window.game.physics.resetState(window.game.playerAstronaut.position, window.game.activePlanetGroup.userData.radius);
        window.game.checkProximityInteractables();
        return true;
      };
    """)

    # Check Earth interactables
    interactables_count = eval_js("window.game.activePlanetGroup.userData.interactables.length")
    print(f"2. Earth Interactables Count: {interactables_count}")
    assert interactables_count >= 4, "Expected at least 4 interactables on Earth"

    # Step 1: Initial proximity to Professor Nova on Earth
    time.sleep(1.0)
    prompt_text = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    prompt_class = eval_js("document.getElementById('interaction-prompt')?.className")
    prompt_hidden = eval_js("document.getElementById('interaction-prompt')?.classList.contains('hidden')")
    modal_states = eval_js("""
      ['farming-stats-modal', 'soil-cross-section-modal', 'teacher-dialogue-modal', 'planet-inspector-modal', 'api-key-modal']
      .map(id => ({ id: id, className: document.getElementById(id)?.className, hasHidden: document.getElementById(id)?.classList.contains('hidden') }))
    """)
    print("Modal states:", modal_states)
    is_modal = eval_js("window.game.isModalOpen()")
    active_int = eval_js("window.game.activeInteractable ? window.game.activeInteractable.type : 'none'")
    print(f"3. Proximity Prompt on Spawn: hidden={prompt_hidden}, class='{prompt_class}', isModal={is_modal}, active={active_int}, text='{prompt_text}'")
    assert not prompt_hidden, "Proximity prompt should be visible near Professor Nova"
    assert "Professor" in prompt_text, f"Expected prompt for Professor Nova, got '{prompt_text}'"

    # Test Teacher Interaction
    print("\n4. Testing Teacher Interaction on Earth...")
    eval_js("window.game.triggerInteraction()")
    time.sleep(1.2)
    teacher_modal_hidden = eval_js("document.getElementById('teacher-dialogue-modal')?.classList.contains('hidden')")
    teacher_text = eval_js("document.getElementById('teacher-dialogue-text')?.textContent?.trim()")
    print(f"Teacher modal hidden: {teacher_modal_hidden}, Dialogue snippet: '{teacher_text[:60]}...'")
    assert not teacher_modal_hidden, "Teacher dialogue modal should be open"
    assert "Welcome" in teacher_text or "Earth" in teacher_text or "Cadet" in teacher_text, "Teacher dialogue should mention Welcome/Earth/Cadet"

    # Test quick question
    print("Testing Teacher quick question click...")
    eval_js("document.querySelector('.teacher-quick-ask')?.click()")
    time.sleep(1.0)
    teacher_answered = eval_js("document.getElementById('teacher-dialogue-text')?.textContent?.trim()")
    print(f"Answer snippet: '{teacher_answered[:60]}...'")

    # Close teacher modal
    eval_js("window.game.closeAllModals()")
    time.sleep(0.3)
    assert eval_js("document.getElementById('teacher-dialogue-modal')?.classList.contains('hidden')")

    # Step 2: Test Plant Specimen Interaction on Earth
    print("\n5. Moving player to Tree #1 (Astrobiology specimen)...")
    eval_js("window.moveToInteractable('PLANT', 2.0);")
    time.sleep(0.5)
    plant_prompt = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    print(f"Plant prompt: '{plant_prompt}'")
    assert "Scan" in plant_prompt or "Biosphere" in plant_prompt, f"Expected Plant prompt, got '{plant_prompt}'"

    eval_js("window.game.triggerInteraction()")
    time.sleep(0.5)
    plant_modal_hidden = eval_js("document.getElementById('farming-stats-modal')?.classList.contains('hidden')")
    plant_species = eval_js("document.getElementById('farm-species-name')?.textContent?.trim()")
    print(f"Farming modal hidden: {plant_modal_hidden}, Species: '{plant_species}'")
    assert not plant_modal_hidden, "Farming stats modal should be open"
    assert "Oak" in plant_species or "Terra" in plant_species or "Pinus" in plant_species, f"Unexpected species: {plant_species}"

    eval_js("window.game.closeAllModals()")
    time.sleep(0.3)

    # Step 3: Test Mining Drill on Earth
    print("\n6. Moving player to Mining Drill...")
    eval_js("window.moveToInteractable('DRILL', 3.2);")
    time.sleep(0.5)
    drill_prompt = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    print(f"Drill prompt: '{drill_prompt}'")
    assert "Inspect" in drill_prompt or "Drill" in drill_prompt or "Cross-Section" in drill_prompt, f"Expected Drill prompt, got '{drill_prompt}'"

    eval_js("window.game.triggerInteraction()")
    time.sleep(0.5)
    drill_modal_hidden = eval_js("document.getElementById('soil-cross-section-modal')?.classList.contains('hidden')")
    drill_strata = eval_js("document.getElementById('drill-strata-1')?.textContent?.trim()")
    print(f"Soil modal hidden: {drill_modal_hidden}, Strata 1: '{drill_strata[:50]}...'")
    assert not drill_modal_hidden, "Soil cross section modal should be open"
    assert "Depth" in drill_strata, "Soil cross section should have strata text"

    eval_js("window.game.closeAllModals()")
    time.sleep(0.3)

    # Step 4: Test Spaceship & Vehicle Transformation on Earth
    print("\n7. Moving player to Spaceship...")
    eval_js("window.moveToInteractable('SPACESHIP', 4.0);")
    time.sleep(0.5)
    ship_prompt = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    print(f"Ship prompt: '{ship_prompt}'")
    assert "Board Ship" in ship_prompt or "Launch" in ship_prompt, f"Expected Ship prompt, got '{ship_prompt}'"
    assert "Transform" in ship_prompt, "Expected Transform option in ship prompt"

    print("Testing Vehicle Transformation [T]...")
    eval_js("window.game.toggleVehicleTransformation()")
    time.sleep(0.5)
    transformed_prompt = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    print(f"Transformed prompt: '{transformed_prompt}'")
    assert "Watership" in transformed_prompt or "Skiff" in transformed_prompt or "Board" in transformed_prompt

    print("Transforming back to Spaceship...")
    eval_js("window.game.toggleVehicleTransformation()")
    time.sleep(0.5)

    # Step 5: Test Boarding Spaceship & Launching into Space
    print("\n8. Testing Spaceship Boarding & Launch...")
    eval_js("window.game.triggerInteraction()")
    time.sleep(0.5)
    boarding_state = eval_js("window.game.currentState")
    print(f"Boarding state: {boarding_state}")
    assert boarding_state == "BOARDING_SPACESHIP", f"Expected BOARDING_SPACESHIP, got {boarding_state}"

    # Wait for boarding and launch sequence to complete and enter Universe Map
    print("Waiting for launch sequence into Universe Map...")
    for _ in range(30):
        st = eval_js("window.game.currentState")
        if st == "UNIVERSE_MAP":
            break
        time.sleep(0.3)

    map_state = eval_js("window.game.currentState")
    print(f"Map state reached: {map_state}")
    assert map_state == "UNIVERSE_MAP", f"Expected UNIVERSE_MAP, got {map_state}"

    # Step 6: Select Exoplanet TRAPPIST-1 e and land
    print("\n9. Selecting TRAPPIST-1 e and initiating orbital approach...")
    eval_js("window.game.universeMap.selectPlanetByName('TRAPPIST-1 e')")
    eval_js("document.getElementById('engage-warp-btn').click()")
    time.sleep(1.0)
    orbital_state = eval_js("window.game.currentState")
    print(f"Orbital state: {orbital_state}")
    assert orbital_state == "ORBITAL_APPROACH"

    print("Initiating Atmospheric Entry descent...")
    eval_js("document.getElementById('start-descent-btn').click()")
    time.sleep(1.0)
    entry_state = eval_js("window.game.currentState")
    print(f"Entry state: {entry_state}")
    assert entry_state == "ATMOSPHERIC_ENTRY"

    print("Waiting for touchdown and TPS view...")
    for _ in range(30):
        st = eval_js("window.game.currentState")
        if st == "SURFACE_EXPLORATION":
            break
        time.sleep(0.3)

    surface_state = eval_js("window.game.currentState")
    print(f"Touchdown confirmed! State: {surface_state}")
    assert surface_state == "SURFACE_EXPLORATION"

    # Close the landing teacher dialog so we can test physical interactables on exoplanet
    eval_js("window.game.closeAllModals()")
    time.sleep(0.5)

    # Check landed ship on exoplanet
    exo_ship_visible = eval_js("window.game.activePlanetGroup.userData.spaceshipMesh.visible")
    print(f"Exo spaceship visible: {exo_ship_visible}")
    assert exo_ship_visible, "Landed spaceship should be visible on exoplanet"

    # Test Exoplanet Teacher Dialogue
    print("\n10. Testing Exoplanet Teacher Interaction...")
    eval_js("window.moveToInteractable('TEACHER', 2.0);")
    time.sleep(0.5)
    exo_teacher_prompt = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    print(f"Exo teacher prompt: '{exo_teacher_prompt}'")
    assert "Professor" in exo_teacher_prompt

    eval_js("window.game.triggerInteraction()")
    time.sleep(1.2)
    exo_teacher_text = eval_js("document.getElementById('teacher-dialogue-text')?.textContent?.trim()")
    print(f"Exo teacher dialogue snippet: '{exo_teacher_text[:70]}...'")
    assert "TRAPPIST" in exo_teacher_text or "Greetings" in exo_teacher_text or "Gravity" in exo_teacher_text, "Teacher should mention planet greeting"

    eval_js("window.game.closeAllModals()")
    time.sleep(0.3)

    # Test Exoplanet Plant / Crystal Specimen
    print("\n11. Testing Exoplanet Flora / Crystal Specimen...")
    eval_js("window.moveToInteractable('PLANT', 2.0);")
    time.sleep(0.5)
    exo_plant_prompt = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    print(f"Exo plant prompt: '{exo_plant_prompt}'")
    assert "Scan" in exo_plant_prompt

    eval_js("window.game.triggerInteraction()")
    time.sleep(0.5)
    exo_species = eval_js("document.getElementById('farm-species-name')?.textContent?.trim()")
    print(f"Exo species scanned: '{exo_species}'")
    assert len(exo_species) > 0

    eval_js("window.game.closeAllModals()")
    time.sleep(0.3)

    # Test Exoplanet Mining Drill
    print("\n12. Testing Exoplanet Core Drill...")
    eval_js("window.moveToInteractable('DRILL', 3.2);")
    time.sleep(0.5)
    exo_drill_prompt = eval_js("document.getElementById('interaction-prompt')?.textContent?.trim()")
    print(f"Exo drill prompt: '{exo_drill_prompt}'")
    assert "Inspect" in exo_drill_prompt or "Drill" in exo_drill_prompt or "Stratum" in exo_drill_prompt

    eval_js("window.game.triggerInteraction()")
    time.sleep(0.5)
    exo_drill_title = eval_js("document.querySelector('#soil-cross-section-modal .modal-title')?.textContent?.trim()")
    print(f"Exo drill title: '{exo_drill_title}'")
    assert "TRAPPIST-1 e" in exo_drill_title

    capture_screenshot(r"C:\Users\sachin\.gemini\antigravity\scratch\exoplanet-odyssey\test_exoplanet_interact_success.png")

    eval_js("window.game.closeAllModals()")
    print("\n==========================================")
    print("ALL INTERACTION TESTS PASSED FLAWLESSLY! 🚀🐾")
    print("==========================================")

finally:
    proc.terminate()
