from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import uuid
from datetime import datetime

from app.database import get_db, init_db
from app.config import settings
from app.models import Incident, KnowledgeBase, User, ChatSession, ChatMessage
from app.llm_handler_simple import simple_llm_handler
from app.kb_processor import kb_processor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sigmoid Incident Management",
    version="1.0.0",
    description="Simple GenAI Incident Management System"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized successfully")
        
        # Initialize knowledge base
        db = next(get_db())
        kb_processor.initialize_knowledge_base(db)
        logger.info("Knowledge base initialized successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.get("/")
async def root():
    return {"message": "Sigmoid Incident Management API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Chat Endpoints
@app.post("/chat/sessions")
async def create_chat_session(db: Session = Depends(get_db)):
    """Create a new chat session"""
    try:
        session_id = str(uuid.uuid4())
        
        session = ChatSession(
            session_id=session_id,
            user_id=1,  # Default user
            current_step="initial",
            collected_data={},
            status="active"
        )
        
        db.add(session)
        db.commit()
        
        # Create welcome message
        welcome_msg = ChatMessage(
            session_id=session_id,
            message_type="bot",
            content="Hello! I'm SigmaAI, your IT support assistant. How can I help you today?",
            message_metadata={"type": "welcome", "confidence": 1.0}
        )
        
        db.add(welcome_msg)
        db.commit()
        
        return {
            "success": True,
            "session_id": session_id,
            "session": session.to_dict(),
            "welcome_message": welcome_msg.to_dict()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating chat session: {e}")
        return {"success": False, "error": str(e)}

@app.post("/chat/sessions/{session_id}/messages")
async def send_chat_message(session_id: str, message_data: Dict, db: Session = Depends(get_db)):
    """Send a message and get AI response"""
    try:
        user_message = message_data.get("content", "").strip()
        if not user_message:
            return {"success": False, "error": "Message content is required"}
        
        # Get session
        session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
        if not session:
            return {"success": False, "error": "Session not found"}
        
        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            message_type="user",
            content=user_message
        )
        db.add(user_msg)
        db.commit()
        
        # Generate AI response
        ai_response = simple_llm_handler.generate_enhanced_response(user_message)
        
        # Save AI response
        bot_msg = ChatMessage(
            session_id=session_id,
            message_type="bot",
            content=ai_response.get("response", "I apologize, but I encountered an error."),
            message_metadata={
                "type": ai_response.get("type", "information"),
                "confidence": ai_response.get("confidence", 0.7),
                "suggested_actions": ai_response.get("suggested_actions", []),
                "estimated_resolution_time": ai_response.get("estimated_resolution_time", 30)
            }
        )
        db.add(bot_msg)
        db.commit()
        
        return {
            "success": True,
            "user_message": user_msg.to_dict(),
            "bot_response": bot_msg.to_dict()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing message: {e}")
        return {"success": False, "error": str(e)}

@app.get("/chat/sessions/{session_id}/messages")
async def get_chat_messages(session_id: str, db: Session = Depends(get_db)):
    """Get chat messages for a session"""
    try:
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.timestamp.asc()).all()
        
        return {
            "success": True,
            "messages": [msg.to_dict() for msg in messages]
        }
        
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        return {"success": False, "error": str(e)}

# Other essential endpoints
@app.get("/incidents")
async def get_incidents(db: Session = Depends(get_db)):
    """Get all incidents"""
    try:
        incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
        return {
            "success": True,
            "incidents": [inc.to_dict() for inc in incidents]
        }
    except Exception as e:
        logger.error(f"Error fetching incidents: {e}")
        return {"success": False, "error": str(e)}

@app.get("/knowledge-base")
async def get_knowledge_base(db: Session = Depends(get_db)):
    """Get knowledge base entries"""
    try:
        entries = db.query(KnowledgeBase).filter(KnowledgeBase.is_active == True).all()
        return {
            "success": True,
            "entries": [entry.to_dict() for entry in entries]
        }
    except Exception as e:
        logger.error(f"Error fetching knowledge base: {e}")
        return {"success": False, "error": str(e)}

@app.get("/analytics/dashboard")
async def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Get dashboard analytics"""
    try:
        total_incidents = db.query(Incident).count()
        open_incidents = db.query(Incident).filter(Incident.status == "Open").count()
        
        return {
            "success": True,
            "analytics": {
                "total_incidents": total_incidents,
                "open_incidents": open_incidents,
                "resolved_today": 0,
                "priority_distribution": {"High": 1, "Medium": 1, "Low": 0},
                "category_distribution": {"Email": 1, "Network": 1},
                "average_resolution_time": 45,
                "ai_resolution_rate": 0.87,
                "user_satisfaction_score": 4.6
            }
        }
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        return {"success": False, "error": str(e)}

@app.get("/ai/health")
async def ai_health_check():
    """Check AI service health"""
    return {
        "success": True,
        "status": "mock_mode",
        "model": "mock-gemini",
        "test_response": "AI is responding with mock data"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
