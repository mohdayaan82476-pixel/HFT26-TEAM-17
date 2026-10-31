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
DEBUG_PORT = 9249

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

    # Enable domains
    send_cdp("Runtime.enable")
    send_cdp("Page.enable")

    print("Waiting for game to initialize...")
    for _ in range(30):
        ready = eval_js("Boolean(window.gameInstance && window.gameInstance.playerAstronaut && window.gameInstance.earthGroup)")
        if ready:
            break
        time.sleep(0.5)

    assert ready, "Game failed to initialize within 15 seconds"
    print("Game successfully initialized!")
    time.sleep(1.0) # Let animations tick

    # 1. Verify Character Names
    player_name = eval_js("window.gameInstance.playerAstronaut.name")
    teacher_name = eval_js("window.gameInstance.activePlanetGroup.userData.teacherMesh.name")
    print(f"Player Character Name: {player_name}")
    print(f"Teacher Character Name: {teacher_name}")
    assert player_name == "Tom", f"Expected player to be named 'Tom', got: {player_name}"
    assert teacher_name == "ProfessorSpike", f"Expected teacher to be named 'ProfessorSpike', got: {teacher_name}"

    # 2. Verify Distances (Tom far away from spaceship and Professor Spike)
    distances = eval_js("""(() => {
        const game = window.gameInstance;
        const tom = game.playerAstronaut.position;
        const ship = game.activePlanetGroup.userData.spaceshipMesh.position;
        const spike = game.activePlanetGroup.userData.teacherMesh.position;

        const shipNDC = ship.clone().project(game.camera);
        const spikeNDC = spike.clone().project(game.camera);

        const shipInFrustum = (shipNDC.z > 0 && shipNDC.z < 1 && Math.abs(shipNDC.x) <= 1.0 && Math.abs(shipNDC.y) <= 1.0);
        const spikeInFrustum = (spikeNDC.z > 0 && spikeNDC.z < 1 && Math.abs(spikeNDC.x) <= 1.0 && Math.abs(spikeNDC.y) <= 1.0);

        return {
            tomToShip: tom.distanceTo(ship),
            tomToSpike: tom.distanceTo(spike),
            spikeToShip: spike.distanceTo(ship),
            shipInFrustum,
            spikeInFrustum,
            shipNDC: { x: shipNDC.x.toFixed(2), y: shipNDC.y.toFixed(2), z: shipNDC.z.toFixed(2) },
            spikeNDC: { x: spikeNDC.x.toFixed(2), y: spikeNDC.y.toFixed(2), z: spikeNDC.z.toFixed(2) }
        };
    })()""")
    print("Initial Distances on Earth:")
    print(f"  Tom to Spaceship: {distances['tomToShip']:.2f}m")
    print(f"  Tom to Professor Spike: {distances['tomToSpike']:.2f}m")
    print(f"  Spike to Spaceship: {distances['spikeToShip']:.2f}m")
    print(f"  Ship in Frustum: {distances['shipInFrustum']} (NDC: {distances['shipNDC']})")
    print(f"  Spike in Frustum: {distances['spikeInFrustum']} (NDC: {distances['spikeNDC']})")

    assert distances['tomToShip'] >= 20.0, f"Tom is not far enough from spaceship: {distances['tomToShip']}m"
    assert distances['tomToSpike'] >= 20.0, f"Tom is not far enough from Spike: {distances['tomToSpike']}m"
    assert not distances['shipInFrustum'], f"Spaceship should NOT be in frame! NDC: {distances['shipNDC']}"
    assert not distances['spikeInFrustum'], f"Professor Spike should NOT be in frame! NDC: {distances['spikeNDC']}"

    # 3. Verify Tom is facing the camera and waving/pointing
    pose_info = eval_js("""(() => {
        const game = window.gameInstance;
        const tom = game.playerAstronaut;
        const cam = game.camera;
        const u = tom.userData;

        // Facing vs Camera direction
        // Camera looks towards Tom, so vector from Tom to Camera is cam.position - tom.position
        const toCam = cam.position.clone().sub(tom.position).normalize();

        // Character facing vector (stored in physics or transformed from local Z)
        const facing = game.physics.characterFacing.clone().normalize();
        const dotProduct = facing.dot(toCam);

        return {
            isPlayerWaving: game.isPlayerWaving,
            facingDotCam: dotProduct,
            rightArmX: u.rightArmGroup ? u.rightArmGroup.rotation.x : 0,
            rightArmZ: u.rightArmGroup ? u.rightArmGroup.rotation.z : 0,
            leftArmX: u.leftArmGroup ? u.leftArmGroup.rotation.x : 0,
            leftArmZ: u.leftArmGroup ? u.leftArmGroup.rotation.z : 0,
            characterType: u.characterType
        };
    })()""")

    print("\nTom Initial Greeting Pose:")
    print(f"  isPlayerWaving: {pose_info['isPlayerWaving']}")
    print(f"  Facing Dot Camera (1.0 = directly towards camera): {pose_info['facingDotCam']:.3f}")
    print(f"  Right Arm rotation: X={pose_info['rightArmX']:.2f}, Z={pose_info['rightArmZ']:.2f} (waving high)")
    print(f"  Left Arm rotation: X={pose_info['leftArmX']:.2f}, Z={pose_info['leftArmZ']:.2f} (pointing forward)")
    print(f"  Character type: {pose_info['characterType']}")

    assert pose_info['isPlayerWaving'] is True, "Tom should have isPlayerWaving set to true on start"
    assert pose_info['facingDotCam'] > 0.85, f"Tom should face towards the camera, got dot={pose_info['facingDotCam']}"
    assert pose_info['rightArmX'] < -1.8, "Tom's right arm should be raised high for waving"
    assert abs(pose_info['leftArmX'] - (-1.50)) < 0.1, "Tom's left arm should be pointing straight towards the camera (-1.50 rad)"

    # Capture initial screenshot
    art_dir = r"C:\Users\sachin\.gemini\antigravity\brain\82bc2f42-54d0-40ab-bf80-9ddff7843d34"
    screen_path = os.path.join(art_dir, "test_tom_far_spawn.png")
    capture_screenshot(screen_path)

    # 4. Verify Movement cancels waving
    print("\nTesting movement transition...")
    eval_js("""(() => {
        window.gameInstance.keys['KeyW'] = true;
    })()""")
    time.sleep(0.3)
    is_waving_after_move = eval_js("window.gameInstance.isPlayerWaving")
    print(f"  isPlayerWaving after KeyW: {is_waving_after_move}")
    assert is_waving_after_move is False, "Movement input should cancel waving!"
    eval_js("""(() => {
        window.gameInstance.keys['KeyW'] = false;
    })()""")

    # 5. Verify Page Reload Behavior
    print("\nTesting page reload behavior...")
    send_cdp("Page.reload")
    time.sleep(2.0)
    for _ in range(30):
        ready = eval_js("Boolean(window.gameInstance && window.gameInstance.playerAstronaut && window.gameInstance.earthGroup)")
        if ready:
            break
        time.sleep(0.5)
    assert ready, "Game failed to reload"
    time.sleep(0.5)

    reloaded_info = eval_js("""(() => {
        const game = window.gameInstance;
        const tom = game.playerAstronaut;
        const cam = game.camera;
        const u = tom.userData;
        const toCam = cam.position.clone().sub(tom.position).normalize();
        const facing = game.physics.characterFacing.clone().normalize();
        const ship = game.activePlanetGroup.userData.spaceshipMesh;
        const spike = game.activePlanetGroup.userData.teacherMesh;

        const shipNDC = ship.position.clone().project(game.camera);
        const spikeNDC = spike.position.clone().project(game.camera);
        const shipInFrustum = (shipNDC.z > 0 && shipNDC.z < 1 && Math.abs(shipNDC.x) <= 1.0 && Math.abs(shipNDC.y) <= 1.0);
        const spikeInFrustum = (spikeNDC.z > 0 && spikeNDC.z < 1 && Math.abs(spikeNDC.x) <= 1.0 && Math.abs(spikeNDC.y) <= 1.0);

        return {
            playerName: tom.name,
            isPlayerWaving: game.isPlayerWaving,
            facingDotCam: facing.dot(toCam),
            leftArmX: u.leftArmGroup.rotation.x,
            rightArmX: u.rightArmGroup.rotation.x,
            distToShip: tom.position.distanceTo(ship.position),
            distToSpike: tom.position.distanceTo(spike.position),
            shipInFrustum,
            spikeInFrustum
        };
    })()""")

    print("Reload State Verification:")
    print(f"  Player Name: {reloaded_info['playerName']}")
    print(f"  isPlayerWaving: {reloaded_info['isPlayerWaving']}")
    print(f"  Facing Dot Cam: {reloaded_info['facingDotCam']:.3f}")
    print(f"  Dist to Ship: {reloaded_info['distToShip']:.2f}m")
    print(f"  Dist to Spike: {reloaded_info['distToSpike']:.2f}m")
    print(f"  Ship in Frustum on reload: {reloaded_info['shipInFrustum']}")
    print(f"  Spike in Frustum on reload: {reloaded_info['spikeInFrustum']}")

    assert reloaded_info['playerName'] == 'Tom'
    assert reloaded_info['isPlayerWaving'] is True
    assert reloaded_info['facingDotCam'] > 0.85
    assert reloaded_info['distToShip'] >= 20.0
    assert reloaded_info['distToSpike'] >= 20.0
    assert not reloaded_info['shipInFrustum']
    assert not reloaded_info['spikeInFrustum']

    # 6. Verify UI texts (Professor Spike, Cadet Tom, no Nova or Whiskers)
    ui_texts = eval_js("""(() => {
        const bodyText = document.body.innerText;
        return {
            hasNova: bodyText.includes('Nova'),
            hasWhiskers: bodyText.includes('Whiskers'),
            hasSpike: bodyText.includes('Spike'),
            hasTom: bodyText.includes('Tom')
        };
    })()""")
    print("\nUI Branding Verification:")
    print(f"  Contains 'Spike': {ui_texts['hasSpike']}")
    print(f"  Contains 'Nova': {ui_texts['hasNova']}")
    print(f"  Contains 'Whiskers': {ui_texts['hasWhiskers']}")
    assert ui_texts['hasNova'] is False, "UI should not contain 'Nova'"
    assert ui_texts['hasWhiskers'] is False, "UI should not contain 'Whiskers'"

    print("\nAll verifications for Tom & Professor Spike PASSED perfectly! 🎉")

finally:
    try:
        proc.terminate()
    except Exception:
        pass
