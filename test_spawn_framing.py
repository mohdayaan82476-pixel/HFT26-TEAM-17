import os
import sys
import time
import subprocess
import json
import urllib.request
import socket
import base64
from urllib.parse import urlparse

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "http://127.0.0.1:8080/index.html"
DEBUG_PORT = 9253

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
time.sleep(2.5)

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

    send_cdp("Runtime.enable")
    send_cdp("Page.enable")

    time.sleep(1.0)
    for _ in range(30):
        ready = eval_js("Boolean(window.gameInstance && window.gameInstance.playerAstronaut && window.gameInstance.earthGroup)")
        if ready:
            break
        time.sleep(0.5)

    print("Testing candidate positions for Tom...")
    # Candidate coordinate sets: lat, lon, description
    test_coords = [
        {"lat": -10, "lon": 25, "desc": "Eastern Highland Vista"},
        {"lat": -15, "lon": 25, "desc": "Southern Meadow Vista"},
        {"lat": 0, "lon": 30, "desc": "Equatorial Mountain Ridge"},
        {"lat": 5, "lon": -68, "desc": "Western Coastal Valley"},
    ]

    for c in test_coords:
        res = eval_js(f"""(() => {{
            const game = window.gameInstance;
            const radius = game.earthGroup.userData.radius;
            const lat = {c['lat']} * Math.PI / 180;
            const lon = {c['lon']} * Math.PI / 180;
            const dir = new THREE.Vector3(
                Math.cos(lat) * Math.sin(lon),
                Math.sin(lat),
                Math.cos(lat) * Math.cos(lon)
            ).normalize();

            const pos = dir.clone().multiplyScalar(radius + 0.1);
            game.playerAstronaut.position.copy(pos);
            const up = pos.clone().normalize();

            // Set camera & facing
            game.physics.resetState(pos, radius);
            game.physics.camDistance = 5.2;
            game.physics.camHeight = 1.6;
            game.physics.camPitch = 0.12;

            // Choose camForward to face away from base camp towards open horizon
            // Base camp is around (27, -20)
            const campDir = new THREE.Vector3(
                Math.cos(27 * Math.PI / 180) * Math.sin(-20 * Math.PI / 180),
                Math.sin(27 * Math.PI / 180),
                Math.cos(27 * Math.PI / 180) * Math.cos(-20 * Math.PI / 180)
            ).normalize();

            // Tangent vector towards camp:
            const toCamp = campDir.clone().sub(up.clone().multiplyScalar(campDir.dot(up))).normalize();
            // Away from camp:
            const awayFromCamp = toCamp.clone().negate().normalize();

            // Camera looks in awayFromCamp direction (past Tom)
            game.physics.camForward.copy(awayFromCamp);
            // Tom looks towards camera (which is -camForward = toCamp)
            const toCamera = game.physics.camForward.clone().negate().normalize();
            game.physics.characterFacing.copy(toCamera);

            const facingRight = new THREE.Vector3().crossVectors(up, toCamera).normalize();
            const pMat = new THREE.Matrix4().makeBasis(facingRight, up, toCamera);
            game.playerAstronaut.quaternion.setFromRotationMatrix(pMat);

            game.physics.updateCamera(game.camera, game.playerAstronaut, up, 1.0);
            game.renderer.render(game.scene, game.camera);

            const ship = game.activePlanetGroup.userData.spaceshipMesh;
            const spike = game.activePlanetGroup.userData.teacherMesh;

            // Project to NDC
            const shipNDC = ship.position.clone().project(game.camera);
            const spikeNDC = spike.position.clone().project(game.camera);

            const shipInFrustum = (shipNDC.z > 0 && shipNDC.z < 1 && Math.abs(shipNDC.x) <= 1.0 && Math.abs(shipNDC.y) <= 1.0);
            const spikeInFrustum = (spikeNDC.z > 0 && spikeNDC.z < 1 && Math.abs(spikeNDC.x) <= 1.0 && Math.abs(spikeNDC.y) <= 1.0);

            return {{
                distToShip: pos.distanceTo(ship.position),
                distToSpike: pos.distanceTo(spike.position),
                shipInFrustum: shipInFrustum,
                spikeInFrustum: spikeInFrustum,
                shipNDC: {{ x: shipNDC.x.toFixed(2), y: shipNDC.y.toFixed(2), z: shipNDC.z.toFixed(2) }},
                spikeNDC: {{ x: spikeNDC.x.toFixed(2), y: spikeNDC.y.toFixed(2), z: spikeNDC.z.toFixed(2) }}
            }};
        }})()""")

        print(f"\n--- {c['desc']} (lat={c['lat']}, lon={c['lon']}) ---")
        print(f"  Distance to Ship: {res['distToShip']:.2f}m")
        print(f"  Distance to Spike: {res['distToSpike']:.2f}m")
        print(f"  Ship in Frustum: {res['shipInFrustum']} (NDC: {res['shipNDC']})")
        print(f"  Spike in Frustum: {res['spikeInFrustum']} (NDC: {res['spikeNDC']})")

    # Take screenshot of the best one: -10, 25
    art_dir = r"C:\Users\sachin\.gemini\antigravity\brain\82bc2f42-54d0-40ab-bf80-9ddff7843d34"
    screen_path = os.path.join(art_dir, "test_candidate_vista.png")
    capture_screenshot(screen_path)

finally:
    try:
        proc.terminate()
    except Exception:
        pass
