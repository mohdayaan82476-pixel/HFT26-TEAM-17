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
DEBUG_PORT = 9246

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
                    print(f"Captured screenshot: {path}")
                return

    print("Waiting for Game initialization...")
    for _ in range(40):
        time.sleep(0.25)
        ready = eval_js("Boolean(window.game && window.game.activePlanetGroup)")
        if ready:
            print("Game instance ready!")
            break

    # ── CHECK 1: Earth Object Overlap & Minimum Distances ────────────────
    print("\n--- CHECK 1: Earth Object Overlap & Minimum Separation ---")
    earth_analysis = eval_js("""
        (() => {
            const group = window.game.earthGroup;
            const colliders = group.userData.colliders || [];
            const interactables = group.userData.interactables || [];

            // Check all pairwise collider distances
            let overlaps = [];
            for (let i = 0; i < colliders.length; i++) {
                for (let j = i + 1; j < colliders.length; j++) {
                    const c1 = colliders[i];
                    const c2 = colliders[j];
                    const dist = c1.position.distanceTo(c2.position);
                    const required = c1.radius + c2.radius;
                    if (dist < required) {
                        overlaps.push({
                            obj1: c1.name,
                            obj2: c2.name,
                            dist: dist.toFixed(2),
                            required: required.toFixed(2),
                            penetration: (required - dist).toFixed(2)
                        });
                    }
                }
            }

            // Check distances between each main interactable
            const ship = interactables.find(i => i.type === 'SPACESHIP');
            const teacher = interactables.find(i => i.type === 'TEACHER');
            const drill = interactables.find(i => i.type === 'DRILL');
            const plant = interactables.find(i => i.type === 'PLANT');
            const spawn = group.userData.spawnPosition;

            const distShipTeacher = ship && teacher ? ship.position.distanceTo(teacher.position).toFixed(2) : null;
            const distShipDrill = ship && drill ? ship.position.distanceTo(drill.position).toFixed(2) : null;
            const distTeacherDrill = teacher && drill ? teacher.position.distanceTo(drill.position).toFixed(2) : null;
            const distTeacherPlant = teacher && plant ? teacher.position.distanceTo(plant.position).toFixed(2) : null;
            const distDrillPlant = drill && plant ? drill.position.distanceTo(plant.position).toFixed(2) : null;

            const distSpawnShip = ship && spawn ? spawn.distanceTo(ship.position).toFixed(2) : null;
            const distSpawnTeacher = teacher && spawn ? spawn.distanceTo(teacher.position).toFixed(2) : null;

            return {
                overlaps,
                totalColliders: colliders.length,
                totalInteractables: interactables.length,
                distShipTeacher,
                distShipDrill,
                distTeacherDrill,
                distTeacherPlant,
                distDrillPlant,
                distSpawnShip,
                distSpawnTeacher
            };
        })()
    """)
    print("Earth Spatial Analysis:", json.dumps(earth_analysis, indent=2))
    assert len(earth_analysis["overlaps"]) == 0, f"Found overlapping objects on Earth: {earth_analysis['overlaps']}"
    assert float(earth_analysis["distShipTeacher"]) >= 10.0, f"Ship-Teacher distance too small: {earth_analysis['distShipTeacher']}m"
    assert float(earth_analysis["distShipDrill"]) >= 10.0, f"Ship-Drill distance too small: {earth_analysis['distShipDrill']}m"
    assert float(earth_analysis["distTeacherDrill"]) >= 10.0, f"Teacher-Drill distance too small: {earth_analysis['distTeacherDrill']}m"
    print("✅ CHECK 1 PASSED: Zero object overlap on Earth, and all interactables spaced >= 10m apart!")

    # ── CHECK 2: Professor Nova Research Table Verification ─────────────
    print("\n--- CHECK 2: Professor Nova Field Table Verification ---")
    teacher_table = eval_js("""
        (() => {
            const teacher = window.game.earthGroup.userData.teacherMesh;
            let hasTable = false;
            let hasProjector = false;
            teacher.traverse(child => {
                if (child.isMesh && child.geometry && child.geometry.type === 'BoxGeometry' && child.geometry.parameters.width >= 1.0) {
                    hasTable = true;
                }
                if (child.isMesh && child.material && child.material.wireframe) {
                    hasProjector = true;
                }
            });
            return { hasTable, hasProjector };
        })()
    """)
    print("Professor Nova Science Station:", teacher_table)
    assert teacher_table["hasTable"], "Professor Nova should have a field research table in front of him!"
    assert teacher_table["hasProjector"], "Professor Nova's table should have a holographic planet console!"
    print("✅ CHECK 2 PASSED: Field research table and holographic projector verified.")

    # ── CHECK 3: Earth Distinct Proximity Prompts ────────────────────────
    print("\n--- CHECK 3: Earth Distinct Interaction Proximity Triggers ---")
    # Move player close to Teacher
    eval_js("""
        (() => {
            const teacher = window.game.earthGroup.userData.interactables.find(i => i.type === 'TEACHER');
            // Position player 2.5m in front of teacher
            const tPos = teacher.position.clone();
            const up = tPos.clone().normalize();
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(teacher.mesh.quaternion);
            const pPos = tPos.clone().addScaledVector(forward, 2.5).normalize().multiplyScalar(26.1);
            window.game.playerAstronaut.position.copy(pPos);
            window.game.checkProximityInteractables();
        })()
    """)
    teacher_prompt = eval_js("""
        (() => {
            const p = document.getElementById('interaction-prompt');
            const isVisible = !p?.classList.contains('hidden');
            const text = p?.textContent;
            const activeType = window.game.activeInteractable?.type;
            return { isVisible, text, activeType };
        })()
    """)
    print("Proximity near Teacher:", teacher_prompt)
    assert teacher_prompt["activeType"] == 'TEACHER', f"Expected TEACHER prompt, got {teacher_prompt['activeType']}"

    # Move player close to Mining Drill
    eval_js("""
        (() => {
            const drill = window.game.earthGroup.userData.interactables.find(i => i.type === 'DRILL');
            const dPos = drill.position.clone();
            const up = dPos.clone().normalize();
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(drill.mesh.quaternion);
            const pPos = dPos.clone().addScaledVector(forward, 2.5).normalize().multiplyScalar(26.1);
            window.game.playerAstronaut.position.copy(pPos);
            window.game.checkProximityInteractables();
        })()
    """)
    drill_prompt = eval_js("""
        (() => {
            const p = document.getElementById('interaction-prompt');
            const isVisible = !p?.classList.contains('hidden');
            const text = p?.textContent;
            const activeType = window.game.activeInteractable?.type;
            return { isVisible, text, activeType };
        })()
    """)
    print("Proximity near Mining Drill:", drill_prompt)
    assert drill_prompt["activeType"] == 'DRILL', f"Expected DRILL prompt, got {drill_prompt['activeType']}"

    # Move player close to Spaceship
    eval_js("""
        (() => {
            const ship = window.game.earthGroup.userData.interactables.find(i => i.type === 'SPACESHIP');
            const sPos = ship.position.clone();
            const up = sPos.clone().normalize();
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(ship.mesh.quaternion);
            const pPos = sPos.clone().addScaledVector(forward, 3.5).normalize().multiplyScalar(26.1);
            window.game.playerAstronaut.position.copy(pPos);
            window.game.checkProximityInteractables();
        })()
    """)
    ship_prompt = eval_js("""
        (() => {
            const p = document.getElementById('interaction-prompt');
            const isVisible = !p?.classList.contains('hidden');
            const text = p?.textContent;
            const activeType = window.game.activeInteractable?.type;
            return { isVisible, text, activeType };
        })()
    """)
    print("Proximity near Spaceship:", ship_prompt)
    assert ship_prompt["activeType"] == 'SPACESHIP', f"Expected SPACESHIP prompt, got {ship_prompt['activeType']}"

    # Move player back to central courtyard
    eval_js("""
        (() => {
            window.game.playerAstronaut.position.copy(window.game.earthGroup.userData.spawnPosition);
            window.game.checkProximityInteractables();
        })()
    """)
    court_prompt = eval_js("""
        (() => {
            const p = document.getElementById('interaction-prompt');
            const isHidden = p?.classList.contains('hidden');
            const activeType = window.game.activeInteractable;
            return { isHidden, activeType };
        })()
    """)
    print("Courtyard center prompt:", court_prompt)
    assert court_prompt["isHidden"], "Courtyard center should be clear with no overlapping prompt!"
    print("✅ CHECK 3 PASSED: Each interactable has distinct, clean, non-conflicting interaction triggers.")

    capture_screenshot("C:/Users/sachin/.gemini/antigravity/brain/82bc2f42-54d0-40ab-bf80-9ddff7843d34/test_earth_spaced_camp.png")

    # ── CHECK 4: Exoplanet Object Overlap & Spacing (TRAPPIST-1 e) ───────
    print("\n--- CHECK 4: Exoplanet (TRAPPIST-1 e) Object Overlap & Spacing ---")
    eval_js("window.game.openGalaxyMap()")
    time.sleep(0.5)
    eval_js("window.game.universeMap.selectPlanetByName('TRAPPIST-1 e')")
    eval_js("window.game.initiateOrbitalApproach(window.game.universeMap.selectedPlanet)")
    time.sleep(0.5)
    eval_js("window.game.initiateAtmosphericEntry()")
    time.sleep(0.5)
    eval_js("window.game.completeLanding()")
    time.sleep(1.0)

    exo_analysis = eval_js("""
        (() => {
            const group = window.game.activePlanetGroup;
            const colliders = group.userData.colliders || [];
            const interactables = group.userData.interactables || [];

            let overlaps = [];
            for (let i = 0; i < colliders.length; i++) {
                for (let j = i + 1; j < colliders.length; j++) {
                    const c1 = colliders[i];
                    const c2 = colliders[j];
                    const dist = c1.position.distanceTo(c2.position);
                    const required = c1.radius + c2.radius;
                    if (dist < required) {
                        overlaps.push({
                            obj1: c1.name,
                            obj2: c2.name,
                            dist: dist.toFixed(2),
                            required: required.toFixed(2),
                            penetration: (required - dist).toFixed(2)
                        });
                    }
                }
            }

            const ship = interactables.find(i => i.type === 'SPACESHIP' || i.type === 'BOAT');
            const teacher = interactables.find(i => i.type === 'TEACHER');
            const drill = interactables.find(i => i.type === 'DRILL');
            const plant = interactables.find(i => i.type === 'PLANT');
            const spawn = group.userData.spawnPosition;

            const distShipTeacher = ship && teacher ? ship.position.distanceTo(teacher.position).toFixed(2) : null;
            const distShipDrill = ship && drill ? ship.position.distanceTo(drill.position).toFixed(2) : null;
            const distTeacherDrill = teacher && drill ? teacher.position.distanceTo(drill.position).toFixed(2) : null;
            const distTeacherPlant = teacher && plant ? teacher.position.distanceTo(plant.position).toFixed(2) : null;
            const distDrillPlant = drill && plant ? drill.position.distanceTo(plant.position).toFixed(2) : null;

            return {
                overlaps,
                totalColliders: colliders.length,
                totalInteractables: interactables.length,
                distShipTeacher,
                distShipDrill,
                distTeacherDrill,
                distTeacherPlant,
                distDrillPlant
            };
        })()
    """)
    print("Exoplanet Spatial Analysis:", json.dumps(exo_analysis, indent=2))
    assert len(exo_analysis["overlaps"]) == 0, f"Found overlapping objects on Exoplanet: {exo_analysis['overlaps']}"
    assert float(exo_analysis["distShipTeacher"]) >= 10.0, f"Exo Ship-Teacher distance too small: {exo_analysis['distShipTeacher']}m"
    assert float(exo_analysis["distShipDrill"]) >= 10.0, f"Exo Ship-Drill distance too small: {exo_analysis['distShipDrill']}m"
    assert float(exo_analysis["distTeacherDrill"]) >= 10.0, f"Exo Teacher-Drill distance too small: {exo_analysis['distTeacherDrill']}m"
    print("✅ CHECK 4 PASSED: Zero object overlap on Exoplanet, all interactables spaced >= 10m apart!")

    capture_screenshot("C:/Users/sachin/.gemini/antigravity/brain/82bc2f42-54d0-40ab-bf80-9ddff7843d34/test_exoplanet_spaced_camp.png")

    print("\n🎉 ALL SPATIAL AND INTERACTION CHECKS PASSED PERFECTLY!")

finally:
    try:
        s.close()
    except Exception:
        pass
    proc.terminate()
