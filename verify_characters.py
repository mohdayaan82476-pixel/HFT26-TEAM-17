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
DEBUG_PORT = 9255
OUTPUT_IMG = r"C:\Users\sachin\.gemini\antigravity\scratch\exoplanet-odyssey\test_character_faces.png"

cmd = [
    CHROME_PATH,
    "--headless=new",
    f"--remote-debugging-port={DEBUG_PORT}",
    "--window-size=1280,720",
    "--disable-gpu",
    "--no-sandbox",
    URL
]

print("Launching Chrome...")
proc = subprocess.Popen(cmd)
time.sleep(3.5)

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
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(handshake.encode())
    s.recv(4096)
    
    def send_cdp(msg_id, method, params={}):
        payload = json.dumps({"id": msg_id, "method": method, "params": params}).encode()
        mask = b"1234"
        masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
        if len(payload) < 126:
            frame = bytearray([0x81, 0x80 | len(payload)])
        else:
            frame = bytearray([0x81, 0x80 | 126]) + len(payload).to_bytes(2, "big")
        s.sendall(frame + mask + masked)

    def recv_frame():
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
            packet = s.recv(min(payload_len - len(data), 65536))
            if not packet:
                break
            data.extend(packet)
        return data

    def capture_screenshot(req_id, output_path):
        send_cdp(req_id, "Page.captureScreenshot", {"format": "png"})
        start_time = time.time()
        while time.time() - start_time < 8.0:
            frame_data = recv_frame()
            if not frame_data:
                time.sleep(0.1)
                continue
            try:
                msg = json.loads(frame_data.decode('utf-8'))
                if msg.get("id") == req_id:
                    img_data = msg.get("result", {}).get("data")
                    if img_data:
                        with open(output_path, 'wb') as fp:
                            fp.write(base64.b64decode(img_data))
                        print(f"SUCCESS: Screenshot saved to {output_path}")
                        return True
            except Exception as e:
                pass
        return False

    send_cdp(1, "Page.enable")
    send_cdp(2, "Runtime.enable")

    time.sleep(2.0)

    print("Positioning characters in open clearing...")
    send_cdp(10, "Runtime.evaluate", {
        "expression": """
        (() => {
            const game = window.gameInstance;
            if (!game) return 'No game';
            game.closeAllModals();
            
            // Move player to an open plateau (lat 0, lon 0) on the sphere
            const R = 26;
            const playerPos = new THREE.Vector3(0, 0, R + 0.1);
            game.playerAstronaut.position.copy(playerPos);
            game.physics.playerPos.copy(playerPos);
            game.physics.characterFacing.set(0, 1, 0); // Facing north (Y+)
            game.playerAstronaut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
            
            // Teacher standing right beside the player
            const teacher = game.activePlanetGroup.userData.teacherMesh;
            if (teacher) {
                teacher.position.set(-1.4, 0, R + 0.1);
                teacher.quaternion.copy(game.playerAstronaut.quaternion);
            }
            
            // Look directly at their faces: camera in front (Z+), slightly above, looking back (Z-)
            game.physics.camForward.set(0, -0.15, -1).normalize();
            game.physics.camDistance = 3.2;
            game.physics.camHeight = 1.35;
            game.physics.camPitch = 0.0;
            return 'Positioned cleanly';
        })()
        """
    })
    time.sleep(1.2)
    capture_screenshot(20, OUTPUT_IMG)

finally:
    proc.kill()
    print("Chrome terminated.")
