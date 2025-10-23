import sys
import os

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from app.main_simple import app

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Sigmoid Incident Management API...")
    print("📍 Server running on http://localhost:8000")
    print("❤️  Health check: http://localhost:8000/health")
    print("💬 Chat API: http://localhost:8000/chat/sessions")
    print("=" * 50)
    
    # Run without reload
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        reload=False,  # Disable reload
        log_level="info"
    )
