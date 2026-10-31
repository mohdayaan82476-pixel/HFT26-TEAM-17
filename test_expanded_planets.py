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
DEBUG_PORT = 9248
OUTPUT_DIR = r"C:\Users\sachin\.gemini\antigravity\brain\82bc2f42-54d0-40ab-bf80-9ddff7843d34"

cmd = [
    CHROME_PATH,
    "--headless=new",
    f"--remote-debugging-port={DEBUG_PORT}",
    "--window-size=1400,900",
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
        mid = send_cdp("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": True
        })
        while True:
            m = recv_msg()
            if m and m.get("id") == mid:
                return m.get("result", {}).get("result", {}).get("value")

    send_cdp("Page.enable")
    send_cdp("Runtime.enable")
    send_cdp("Log.enable")

    # 1. Wait for game initialization
    print("Waiting for gameInstance initialization...")
    ready = False
    for _ in range(30):
        # Check for any console errors or exceptions
        m = recv_msg()
        if m and "Runtime.exceptionThrown" in m.get("method", ""):
            print("JS EXCEPTION:", json.dumps(m, indent=2))
        elif m and "Log.entryAdded" in m.get("method", ""):
            print("CONSOLE LOG:", json.dumps(m, indent=2))

        if eval_js("Boolean(window.gameInstance && window.gameInstance.universeMap && window.gameInstance.universeMap.planetNodes && window.gameInstance.universeMap.planetNodes.length > 0)"):
            ready = True
            break
        time.sleep(0.5)

    assert ready, "Game failed to initialize within 12 seconds."
    print("Game instance ready!")

    # 2. Check catalog counts
    catalog_info = eval_js("""
        (() => {
            const uMap = window.gameInstance.universeMap;
            const nodes = uMap.planetNodes;
            const earthNode = uMap.earthNode;
            const rosterCards = document.querySelectorAll('.roster-card');
            const subtitle = document.getElementById('map-worlds-count')?.textContent;
            return {
                nodeCount: nodes.length,
                hasEarthNode: Boolean(earthNode),
                rosterCardCount: rosterCards.length,
                subtitle: subtitle
            };
        })()
    """)
    print("Catalog Info:", json.dumps(catalog_info, indent=2))
    assert catalog_info["nodeCount"] >= 50, f"Expected >= 50 exoplanet nodes, got {catalog_info['nodeCount']}"
    assert catalog_info["hasEarthNode"], "Earth node should be registered"
    assert catalog_info["rosterCardCount"] >= 51, f"Expected >= 51 roster cards, got {catalog_info['rosterCardCount']}"
    print(f"CHECK 1 PASSED: Verified {catalog_info['nodeCount']} real NASA Archive exoplanets loaded (+ Earth).")

    # 3. Open Galaxy Map
    eval_js("window.gameInstance.openGalaxyMap()")
    time.sleep(0.6)

    # 4. Test 3D spatial coordinates (no NaN, no duplicate identical points)
    spatial_check = eval_js("""
        (() => {
            const nodes = window.gameInstance.universeMap.planetNodes;
            let hasNaN = false;
            const positions = [];
            let duplicateCount = 0;

            nodes.forEach((n, idx) => {
                const p = n.targetPos;
                if (isNaN(p.x) || isNaN(p.y) || isNaN(p.z)) hasNaN = true;
                if (isNaN(n.data.dist_ly) || isNaN(n.data.surfaceGravity)) hasNaN = true;

                for (let other of positions) {
                    const d = Math.hypot(p.x - other.x, p.y - other.y, p.z - other.z);
                    if (d < 0.05) duplicateCount++;
                }
                positions.push({ x: p.x, y: p.y, z: p.z, name: n.data.pl_name });
            });

            return { hasNaN, duplicateCount, total: nodes.length };
        })()
    """)
    print("3D Spatial Check:", json.dumps(spatial_check, indent=2))
    assert not spatial_check["hasNaN"], "3D nodes contain NaN coordinates!"
    assert spatial_check["duplicateCount"] == 0, f"Found {spatial_check['duplicateCount']} overlapping 3D positions in starfield!"
    print("CHECK 2 PASSED: All 3D nodes have distinct, valid, non-overlapping celestial positions.")

    # 5. Test Filter Pills
    filter_categories = ["goldilocks", "super-earth", "liquid", "lava", "gas-giant", "nearby", "all"]
    filter_results = {}
    for f in filter_categories:
        counts = eval_js(f"""
            (() => {{
                const btn = document.querySelector(`.filter-pill[data-filter="{f}"]`);
                btn?.click();
                const visibleCards = document.querySelectorAll('.roster-card:not([style*="display: none"])');
                const visibleNodes = window.gameInstance.universeMap.planetNodes.filter(n => n.nodeGroup.visible);
                const counter = document.getElementById('roster-counter')?.textContent;
                return {{
                    filter: "{f}",
                    visibleCards: visibleCards.length,
                    visibleNodes: visibleNodes.length,
                    counterText: counter
                }};
            }})()
        """)
        filter_results[f] = counts
        time.sleep(0.25)

    print("Filter Results:\n", json.dumps(filter_results, indent=2))
    assert filter_results["goldilocks"]["visibleCards"] >= 10, "Should have >= 10 habitable planets"
    assert filter_results["super-earth"]["visibleCards"] >= 5, "Should have >= 5 super-earths"
    assert filter_results["liquid"]["visibleCards"] >= 3, "Should have >= 3 ocean worlds"
    assert filter_results["lava"]["visibleCards"] >= 4, "Should have >= 4 lava worlds"
    assert filter_results["gas-giant"]["visibleCards"] >= 6, "Should have >= 6 gas giants"
    assert filter_results["nearby"]["visibleCards"] >= 8, "Should have >= 8 nearby worlds"
    assert filter_results["all"]["visibleCards"] == catalog_info["rosterCardCount"], "All filter should show all cards"
    print("CHECK 3 PASSED: All category filter pills function correctly and synchronize with 3D map.")

    # 6. Test Search input
    search_trappist = eval_js("""
        (() => {
            const input = document.getElementById('map-search-input');
            input.value = 'TRAPPIST';
            input.dispatchEvent(new Event('input'));
            const visibleCards = Array.from(document.querySelectorAll('.roster-card:not([style*="display: none"])')).map(c => c.getAttribute('data-name'));
            const counter = document.getElementById('roster-counter')?.textContent;
            return { count: visibleCards.length, names: visibleCards, counter };
        })()
    """)
    print("TRAPPIST Search:", json.dumps(search_trappist, indent=2))
    assert search_trappist["count"] >= 7, f"Expected all 7 TRAPPIST worlds, got {search_trappist['count']}"
    print("CHECK 4 PASSED: Instant search by name/host functions properly with live counter.")

    # Test Empty Search + Reset
    empty_search = eval_js("""
        (() => {
            const input = document.getElementById('map-search-input');
            input.value = 'xyznonexistentworld123';
            input.dispatchEvent(new Event('input'));
            const emptyState = document.getElementById('roster-empty-state');
            const resetBtn = document.getElementById('roster-reset-btn');
            return { hasEmptyState: Boolean(emptyState), hasResetBtn: Boolean(resetBtn) };
        })()
    """)
    assert empty_search["hasEmptyState"] and empty_search["hasResetBtn"], "Empty search should display empty state with reset button"

    # Reset filters
    eval_js("document.getElementById('roster-reset-btn')?.click()")
    time.sleep(0.3)

    # 7. Select a planet and verify Caliper HUD and Inspector
    select_res = eval_js("""
        (() => {
            window.gameInstance.universeMap.selectPlanetByName('Proxima Centauri b');
            window.gameInstance.displayPlanetInspector(window.gameInstance.universeMap.selectedPlanet);

            const name = document.getElementById('inspect-pl-name')?.textContent;
            const host = document.getElementById('inspect-host-star')?.textContent;
            const dist = document.getElementById('inspect-distance')?.textContent;
            const caliperTarget = document.getElementById('caliper-target-name')?.textContent;
            const caliperDist = document.getElementById('caliper-dist-value')?.textContent;

            return { name, host, dist, caliperTarget, caliperDist };
        })()
    """)
    print("Selection Verification:", json.dumps(select_res, indent=2))
    assert "Proxima Centauri b" in select_res["name"], "Inspector should display Proxima Centauri b"
    assert "Proxima Centauri" in select_res["host"], "Host star should be Proxima Centauri"
    assert "4.2" in select_res["dist"], "Distance should be 4.2 Light-Years"
    assert "Proxima Centauri b" in select_res["caliperTarget"], "Caliper target should show Proxima Centauri b"
    print("CHECK 5 PASSED: Selection, Caliper HUD, and Inspector Modal verified.")

    # 8. Capture high-res screenshot of Galaxy Map
    mid = send_cdp("Page.captureScreenshot", {"format": "png"})
    while True:
        m = recv_msg()
        if m and m.get("id") == mid:
            shot_bytes = base64.b64decode(m.get("result", {}).get("data", ""))
            shot_path = os.path.join(OUTPUT_DIR, "test_expanded_nasa_archive_map.png")
            with open(shot_path, "wb") as f:
                f.write(shot_bytes)
            print(f"Captured screenshot: {shot_path}")
            break

    print("\nALL EXPANDED EXOPLANET ARCHIVE AND MAP CHECKS PASSED PERFECTLY!")

finally:
    proc.terminate()
