import http.server
import socketserver
import os
import webbrowser
import sys

PORT = 8000

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Prevent accessing files outside workspace
        # Standard translate_path maps path to filesystem relative to current working directory
        root = os.path.dirname(os.path.abspath(__file__))
        
        # Strip leading slash and decode URL escape codes
        import urllib.parse
        cleaned_path = urllib.parse.unquote(path.lstrip('/'))
        
        # Build local path
        local_path = os.path.join(root, cleaned_path)
        
        # If no file specified, default to index.html
        if os.path.isdir(local_path):
            local_path = os.path.join(local_path, 'index.html')
            
        return local_path

def start_server():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_dir)
    
    Handler = DashboardHandler
    
    # Enable re-using address to avoid "address already in use" errors on restart
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("=" * 80)
            print(f"   SUPPLY CHAIN DISRUPTION WEB DASHBOARD DEVELOPMENT SERVER")
            print("=" * 80)
            print(f"Server successfully started on: http://localhost:{PORT}")
            print(f"Serving static folder: {root_dir}")
            print("To stop the server, press Ctrl+C in this console window.")
            print("=" * 80)
            
            # Automatically launch web browser
            webbrowser.open(f"http://localhost:{PORT}")
            
            # Start serving requests
            httpd.serve_forever()
            
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Please verify that port 8000 is not already in use by another application.")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
