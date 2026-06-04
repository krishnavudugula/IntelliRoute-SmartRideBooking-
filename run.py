#!/usr/bin/env python3
"""
IntelliRoute Server Launcher
Starts the FastAPI backend with integrated frontend serving
"""

import subprocess
import sys
import time
import os

def main():
    print("\n" + "="*60)
    print("🚀 Starting IntelliRoute Server...")
    print("="*60)
    print("\nBackend API will use port 8000")
    print("Frontend will be served from the same server")
    print("\n" + "="*60 + "\n")
    
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    
    # Run Uvicorn with auto-reload for development
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
        "--reload-dir",
        os.path.dirname(__file__),
    ]
    
    print("Backend API: http://127.0.0.1:8000")
    print("API Docs: http://127.0.0.1:8000/docs")
    print("Frontend: http://127.0.0.1:8000/")
    print("\nPress Ctrl+C to stop the server.\n")
    print("="*60 + "\n")
    
    try:
        subprocess.run(cmd, cwd=backend_dir, check=True)
    except KeyboardInterrupt:
        print("\n\n🛑 IntelliRoute server stopped.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
