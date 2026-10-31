import urllib.request
import json
import time
import subprocess
import socket
import base64
from urllib.parse import urlparse

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9265
URL = 'http://127.0.0.1:8080/index.html'

proc = subprocess.Popen([
    CHROME_PATH,
    '--headless=new',
    f'--remote-debugging-port={PORT}',
    '--window-size=1280,720',
    URL
])
time.sleep(2)

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

    send_cdp('Runtime.enable')
    send_cdp('Page.enable')
    time.sleep(2)

    script_land = """
        window.game.openGalaxyMap();
        window.game.universeMap.selectPlanetByName('TRAPPIST-1 e');
        const pl = window.game.universeMap.selectedPlanet;
        window.game.initiateOrbitalApproach(pl);
        window.game.initiateAtmosphericEntry();
        window.game.cinematicTime = 5.0;
        window.game.updateAtmosphericEntry(1.0);
    """
    eval_js(script_land)
    time.sleep(1.5)

    script_interact = """
        const teacher = window.game.activePlanetGroup.userData.interactables.find(i => i.type === 'TEACHER');
        window.game.activeInteractable = teacher;
        window.game.triggerInteraction();
    """
    eval_js(script_interact)
    time.sleep(1.5)

    sid = send_cdp('Page.captureScreenshot', {'format': 'png'})
    res = recv_id(sid)
    b64 = res.get('result', {}).get('data')
    with open('C:/Users/sachin/.gemini/antigravity/scratch/exoplanet-odyssey/live_trappist_table.png', 'wb') as f:
        f.write(base64.b64decode(b64))
    print('Saved live_trappist_table.png successfully!')
finally:
    proc.terminate()
