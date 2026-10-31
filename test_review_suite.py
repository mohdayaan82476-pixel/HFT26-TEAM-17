import urllib.request
import json
import time
import subprocess
import socket
import base64
from urllib.parse import urlparse

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9255
URL = 'http://127.0.0.1:8080/index.html'

proc = subprocess.Popen([
    CHROME_PATH,
    '--headless=new',
    f'--remote-debugging-port={PORT}',
    '--window-size=1280,720',
    URL
])
time.sleep(2.5)

try:
    tabs = json.loads(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json').read().decode('utf-8'))
    ws_url = [t['webSocketDebuggerUrl'] for t in tabs if 'index.html' in t.get('url','')][0]
    u = urlparse(ws_url)
    s = socket.create_connection((u.hostname, u.port), 10)
    key = base64.b64encode(b'1234567890123456').decode()
    s.sendall(f'GET {u.path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode())
    s.recv(4096)

    mid = 100
    def send_cdp(method, params=None):
        global mid
        if params is None: params = {}
        mid += 1
        payload = json.dumps({'id': mid, 'method': method, 'params': params}).encode()
        mask = b'1234'
        masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
        if len(payload) < 126:
            frame = bytearray([0x81, 0x80 | len(payload)])
        else:
            frame = bytearray([0x81, 0x80 | 126]) + len(payload).to_bytes(2, 'big')
        s.sendall(frame + mask + masked)
        return mid

    def recv_id(target_id):
        while True:
            header = s.recv(2)
            if not header: return None
            b2 = header[1]
            l = b2 & 0x7F
            if l == 126:
                l = int.from_bytes(s.recv(2), 'big')
            elif l == 127:
                l = int.from_bytes(s.recv(8), 'big')
            data = bytearray()
            while len(data) < l:
                chunk = s.recv(l - len(data))
                if not chunk: break
                data.extend(chunk)
            msg = json.loads(data.decode('utf-8'))
            if msg.get('id') == target_id:
                return msg

    def eval_js(expr):
        qid = send_cdp('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
        res = recv_id(qid)
        return res.get('result', {}).get('result', {}).get('value')

    def save_shot(path):
        sid = send_cdp('Page.captureScreenshot', {'format': 'png'})
        res = recv_id(sid)
        b64 = res.get('result', {}).get('data')
        with open(path, 'wb') as f:
            f.write(base64.b64decode(b64))
        print(f"Captured: {path}")

    send_cdp('Runtime.enable')
    send_cdp('Page.enable')
    time.sleep(2)

    # Check ready
    ready = eval_js("Boolean(window.game && window.game.earthGroup && window.game.playerAstronaut)")
    print(f"Game ready: {ready}")
    save_shot('C:/Users/sachin/.gemini/antigravity/scratch/exoplanet-odyssey/review_01_earth_surface.png')

    # Open Galaxy Map
    eval_js("window.game.openGalaxyMap()")
    eval_js("window.game.universeMap.selectPlanetByName('TRAPPIST-1 e')")
    eval_js("window.game.displayPlanetInspector(window.game.universeMap.selectedPlanet)")
    time.sleep(1)
    save_shot('C:/Users/sachin/.gemini/antigravity/scratch/exoplanet-odyssey/review_02_galaxy_map.png')

    # Initiate Orbital Approach on TRAPPIST-1 e
    eval_js("window.game.initiateOrbitalApproach(window.game.universeMap.selectedPlanet)")
    time.sleep(1)
    save_shot('C:/Users/sachin/.gemini/antigravity/scratch/exoplanet-odyssey/review_03_orbital_approach.png')

    # Initiate Atmospheric Descent
    eval_js("window.game.initiateAtmosphericEntry()")
    time.sleep(1.5)
    save_shot('C:/Users/sachin/.gemini/antigravity/scratch/exoplanet-odyssey/review_04_atmospheric_entry.png')

    # Wait for touchdown on TRAPPIST-1 e (descent takes ~4.5 seconds)
    time.sleep(4.5)
    save_shot('C:/Users/sachin/.gemini/antigravity/scratch/exoplanet-odyssey/review_05_trappist_surface.png')

    # Teacher Dialogue on TRAPPIST-1 e
    time.sleep(2.0)
    save_shot('C:/Users/sachin/.gemini/antigravity/scratch/exoplanet-odyssey/review_06_teacher_dialog.png')

    print("All review captures successfully completed!")
finally:
    proc.terminate()
