"""
SPECTRAL X PRO - Web Control Server
Servidor local que sirve el panel web y comunica comandos al programa C++
via archivos JSON compartidos.

Uso:
    python server.py              # Inicia en 127.0.0.1:8080
    python server.py --port 9090  # Puerto personalizado
    python server.py --ip 0.0.0.0 # Accesible desde la red local
    python server.py --daemon     # Modo invisible (sin ventana)
"""

import json
import os
import sys
import time
import socket
import argparse
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

try:
    from websocket_server import WebsocketServer
    HAS_WS = True
except ImportError:
    HAS_WS = False

CONFIG_DIR = Path(__file__).parent
COMMAND_FILE = CONFIG_DIR / "command.json"
STATE_FILE = CONFIG_DIR / "state.json"
STATIC_DIR = CONFIG_DIR

current_state = {}
ws_clients = []
ws_server = None


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def load_state():
    global current_state
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, 'r') as f:
                current_state = json.load(f)
        except Exception:
            current_state = {}


def save_state():
    try:
        with open(STATE_FILE, 'w') as f:
            json.dump(current_state, f, indent=2)
    except Exception:
        pass


def write_command(cmd):
    try:
        with open(COMMAND_FILE, 'w') as f:
            json.dump(cmd, f, indent=2)
    except Exception:
        pass


def broadcast_state():
    if not HAS_WS or not ws_server:
        return
    msg = json.dumps({"type": "state", "data": current_state})
    for client in ws_clients[:]:
        try:
            ws_server.send_message(client, msg)
        except Exception:
            ws_clients.remove(client)


class WebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self):
        if self.path == '/api/ping':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "ip": get_local_ip()}).encode())
            return
        if self.path == '/api/state':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(current_state).encode())
            return
        if self.path == '/':
            self.path = '/index.html'
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/command':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                cmd = json.loads(body)
                process_command(cmd)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass


def process_command(cmd):
    cmd_type = cmd.get('type')

    if cmd_type == 'toggle':
        feature = cmd['feature']
        value = cmd['value']
        current_state[feature] = value
        write_command(cmd)
        save_state()

    elif cmd_type == 'slider':
        feature = cmd['feature']
        value = cmd['value']
        current_state[feature] = value
        write_command(cmd)
        save_state()

    elif cmd_type == 'select':
        feature = cmd['feature']
        value = cmd['value']
        current_state[feature] = value
        write_command(cmd)
        save_state()

    elif cmd_type == 'chams':
        current_state['ChamsMode'] = cmd['mode']
        write_command(cmd)
        save_state()

    elif cmd_type == 'emergency':
        current_state.clear()
        write_command({"type": "emergency"})
        save_state()

    elif cmd_type == 'reset_all':
        current_state.clear()
        write_command({"type": "reset_all"})
        save_state()

    elif cmd_type == 'get_state':
        pass

    broadcast_state()


def on_ws_message(client, server, message):
    try:
        cmd = json.loads(message)
        process_command(cmd)
    except Exception:
        pass


def on_ws_connect(client, server):
    ws_clients.append(client)
    try:
        msg = json.dumps({"type": "state", "data": current_state})
        server.send_message(client, msg)
    except Exception:
        pass


def on_ws_disconnect(client, server):
    if client in ws_clients:
        ws_clients.remove(client)


def cleanup_old_commands():
    while True:
        time.sleep(2)
        if COMMAND_FILE.exists():
            try:
                age = time.time() - COMMAND_FILE.stat().st_mtime
                if age > 5:
                    COMMAND_FILE.unlink(missing_ok=True)
            except Exception:
                pass


def main():
    parser = argparse.ArgumentParser(description='SPECTRAL X PRO Web Control Server')
    parser.add_argument('--ip', default='127.0.0.1', help='IP to bind (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=8080, help='Port (default: 8080)')
    parser.add_argument('--daemon', action='store_true', help='Run in background (no window)')
    args = parser.parse_args()

    if args.daemon:
        if sys.platform == 'win32':
            import ctypes
            hwnd = ctypes.windll.kernel32.GetConsoleWindow()
            if hwnd:
                ctypes.windll.user32.ShowWindow(hwnd, 0)

    load_state()

    cleanup_thread = threading.Thread(target=cleanup_old_commands, daemon=True)
    cleanup_thread.start()

    local_ip = get_local_ip()
    print("=" * 50)
    print("  SPECTRAL X PRO - Web Control Server")
    print("=" * 50)
    print(f"  Local:   http://127.0.0.1:{args.port}")
    print(f"  Network: http://{local_ip}:{args.port}")
    print(f"  Abrir desde el celular en la misma red WiFi")
    print("=" * 50)
    print(f"  Config JSON: {COMMAND_FILE}")
    print(f"  State JSON:  {STATE_FILE}")
    print("=" * 50)

    if HAS_WS:
        global ws_server
        ws_server = WebsocketServer(host=args.ip, port=args.port + 1)
        ws_server.set_fn_message_received(on_ws_message)
        ws_server.set_fn_client_connected(on_ws_connect)
        ws_server.set_fn_client_disconnected(on_ws_disconnect)
        ws_thread = threading.Thread(target=ws_server.run_forever, daemon=True)
        ws_thread.start()
        print(f"  WebSocket: ws://{local_ip}:{args.port + 1}")
        print("=" * 50)

    server = HTTPServer((args.ip, args.port), WebHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        server.server_close()


if __name__ == '__main__':
    main()
