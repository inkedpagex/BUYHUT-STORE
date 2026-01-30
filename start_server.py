import http.server
import socketserver
import socket

PORT = 8000

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        ip_address = get_ip()
        print(f"\n[+] Server started successfully!")
        print(f"To view on your mobile, connect to the same Wi-Fi and open:")
        print(f"http://{ip_address}:{PORT}")
        print(f"\nOn this computer: http://localhost:{PORT}")
        print("\nPress Ctrl+C to stop the server.")
        httpd.serve_forever()
except OSError as e:
    if e.errno == 98 or e.errno == 10048:
        print(f"[-] Port {PORT} is already in use. Try closing other servers or use a different port.")
    else:
        raise e
except KeyboardInterrupt:
    print("\n[-] Server stopped.")
