import http.server
import socketserver
import os
import sys
import webbrowser

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(('127.0.0.1', PORT), Handler)
    url = f'http://127.0.0.1:{PORT}/index.html'
    print('=' * 65)
    print('🪐 EXOPLANET ODYSSEY 3D WEB GAME SERVER')
    print('=' * 65)
    print(f'Game running at: {url}')
    print('Press Ctrl+C to stop.')
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
