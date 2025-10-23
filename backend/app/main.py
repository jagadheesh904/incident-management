from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
import uuid
from datetime import datetime, timedelta

from app.database import get_db, init_db
from app.config import settings
from app.models import Incident, KnowledgeBase, User, ChatSession, ChatMessage, Analytics
from app.llm_handler import llm_handler
from app.kb_processor import kb_processor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="GenAI-powered Incident Management System for Sigmoid Services"
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

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Sigmoid GenAI Incident Management System",
        "version": settings.VERSION,
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Incident Management Endpoints
@app.post("/incidents", response_model=Dict[str, Any])
async def create_incident(
    incident_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Create a new incident"""
    try:
        # Generate incident ID
        today = datetime.now().strftime("%Y%m%d")
        last_incident = db.query(Incident).filter(
            Incident.incident_id.like(f"INC{today}%")
        ).order_by(Incident.id.desc()).first()
        
        if last_incident:
            last_num = int(last_incident.incident_id[11:14])
            new_num = last_num + 1
        else:
            new_num = 1
        
        incident_id = f"INC{today}{new_num:03d}"
        
        # Create incident
        incident = Incident(
            incident_id=incident_id,
            title=incident_data.get("title", "Untitled Incident"),
            description=incident_data.get("description", ""),
            category=incident_data.get("category", "General"),
            priority=incident_data.get("priority", "Medium"),
            status="Open",
            created_by=incident_data.get("created_by", "anonymous"),
            assigned_to=incident_data.get("assigned_to"),
            additional_info=incident_data.get("additional_info", {}),
            predicted_category=incident_data.get("predicted_category"),
            confidence_score=incident_data.get("confidence_score"),
            sentiment_score=incident_data.get("sentiment_score")
        )
        
        db.add(incident)
        db.commit()
        db.refresh(incident)
        
        logger.info(f"Created incident {incident_id}")
        
        return {
            "success": True,
            "incident_id": incident_id,
            "incident": incident.to_dict(),
            "message": "Incident created successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating incident: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create incident"
        )

@app.get("/incidents", response_model=Dict[str, Any])
async def get_incidents(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get incidents with filtering and pagination"""
    try:
        query = db.query(Incident)
        
        # Apply filters
        if status:
            query = query.filter(Incident.status == status)
        if category:
            query = query.filter(Incident.category == category)
        if priority:
            query = query.filter(Incident.priority == priority)
        
        total = query.count()
        incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()
        
        return {
            "success": True,
            "incidents": [incident.to_dict() for incident in incidents],
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching incidents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch incidents"
        )

@app.get("/incidents/{incident_id}", response_model=Dict[str, Any])
async def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Get specific incident by ID"""
    try:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        return {
            "success": True,
            "incident": incident.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching incident {incident_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch incident"
        )

@app.put("/incidents/{incident_id}", response_model=Dict[str, Any])
async def update_incident(
    incident_id: str,
    update_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Update incident"""
    try:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(incident, field) and field not in ['id', 'incident_id', 'created_at']:
                setattr(incident, field, value)
        
        incident.updated_at = datetime.utcnow()
        
        # If status changed to resolved, set resolved_at
        if update_data.get('status') == 'Resolved' and not incident.resolved_at:
            incident.resolved_at = datetime.utcnow()
            
            # Calculate resolution time
            if incident.created_at:
                resolution_time = (incident.resolved_at - incident.created_at).total_seconds() / 60
                incident.resolution_time_minutes = int(resolution_time)
        
        db.commit()
        db.refresh(incident)
        
        return {
            "success": True,
            "incident": incident.to_dict(),
            "message": "Incident updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating incident {incident_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update incident"
        )

# Chat Endpoints
@app.post("/chat/sessions", response_model=Dict[str, Any])
async def create_chat_session(
    session_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    try:
        session_id = str(uuid.uuid4())
        
        session = ChatSession(
            session_id=session_id,
            user_id=session_data.get("user_id", 1),  # Default user
            current_step="initial",
            collected_data={},
            status="active"
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create welcome message
        welcome_msg = ChatMessage(
            session_id=session_id,
            message_type="bot",
            content="Hello! I'm your IT support assistant. I'm here to help you resolve any technical issues you're experiencing. Could you please describe what problem you're facing?",
            message_metadata={
                "type": "welcome",
                "suggested_actions": ["Report an issue", "Check status", "Get help"],
                "confidence": 1.0
            }
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat session"
        )

@app.post("/chat/sessions/{session_id}/messages", response_model=Dict[str, Any])
async def send_chat_message(
    session_id: str,
    message_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Send a message in chat session and get AI response"""
    try:
        # Get session
        session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        user_message = message_data.get("content", "").strip()
        if not user_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content is required"
            )
        
        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            message_type="user",
            content=user_message
        )
        db.add(user_msg)
        
        # Analyze sentiment
        sentiment = llm_handler.analyze_sentiment(user_message)
        
        # Find matching KB entries
        kb_matches = kb_processor.find_matching_kb_entries(user_message, db)
        
        # Prepare context for AI
        context = {
            "session_data": session.to_dict(),
            "kb_entries": kb_matches,
            "sentiment_analysis": sentiment,
            "conversation_history": _get_conversation_history(session_id, db)
        }
        
        # Generate AI response
        ai_response = llm_handler.generate_response(user_message, context)
        
        # Update session based on AI response
        if kb_matches and ai_response.get('requires_clarification', False):
            best_match = kb_matches[0]
            session.current_step = "collecting_info"
            session.collected_data["initial_issue"] = user_message
            session.missing_info = kb_processor._get_missing_fields(
                best_match['required_info'], 
                session.collected_data
            )
        
        session.updated_at = datetime.utcnow()
        
        # Save AI response
        bot_msg = ChatMessage(
            session_id=session_id,
            message_type="bot",
            content=ai_response.get("response", "I apologize, but I encountered an error."),
            message_metadata={
                "type": ai_response.get("type", "information"),
                "confidence": ai_response.get("confidence", 0.7),
                "suggested_actions": ai_response.get("suggested_actions", []),
                "requires_clarification": ai_response.get("requires_clarification", False),
                "next_steps": ai_response.get("next_steps", []),
                "kb_matches": [match['kb_id'] for match in kb_matches] if kb_matches else []
            }
        )
        db.add(bot_msg)
        
        db.commit()
        
        return {
            "success": True,
            "user_message": user_msg.to_dict(),
            "bot_response": bot_msg.to_dict(),
            "session_updated": session.to_dict(),
            "sentiment_analysis": sentiment,
            "kb_matches": kb_matches
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )

@app.get("/chat/sessions/{session_id}/messages", response_model=Dict[str, Any])
async def get_chat_messages(
    session_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get chat messages for a session"""
    try:
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.timestamp.asc()).limit(limit).all()
        
        return {
            "success": True,
            "messages": [msg.to_dict() for msg in messages],
            "total": len(messages)
        }
        
    except Exception as e:
        logger.error(f"Error fetching chat messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat messages"
        )

def _get_conversation_history(session_id: str, db: Session, limit: int = 10) -> List[Dict]:
    """Get conversation history for context"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()
    
    history = []
    for msg in reversed(messages):  # Return in chronological order
        history.append({
            "type": msg.message_type,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
        })
    
    return history

# Knowledge Base Endpoints
@app.get("/knowledge-base", response_model=Dict[str, Any])
async def get_knowledge_base(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get knowledge base entries"""
    try:
        query = db.query(KnowledgeBase).filter(KnowledgeBase.is_active == True)
        
        if category:
            query = query.filter(KnowledgeBase.category == category)
        
        if search:
            query = query.filter(
                KnowledgeBase.use_case.ilike(f"%{search}%") |
                KnowledgeBase.tags.contains([search])
            )
        
        entries = query.order_by(KnowledgeBase.use_case).all()
        
        return {
            "success": True,
            "entries": [entry.to_dict() for entry in entries],
            "total": len(entries)
        }
        
    except Exception as e:
        logger.error(f"Error fetching knowledge base: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch knowledge base"
        )

# Analytics Endpoints
@app.get("/analytics/dashboard", response_model=Dict[str, Any])
async def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Get dashboard analytics"""
    try:
        # Incident statistics
        total_incidents = db.query(Incident).count()
        open_incidents = db.query(Incident).filter(Incident.status == "Open").count()
        resolved_today = db.query(Incident).filter(
            Incident.status == "Resolved",
            Incident.resolved_at >= datetime.now().date()
        ).count()
        
        # Priority distribution
        priorities = db.query(Incident.priority, db.func.count(Incident.id)).group_by(Incident.priority).all()
        priority_dist = {priority: count for priority, count in priorities}
        
        # Category distribution
        categories = db.query(Incident.category, db.func.count(Incident.id)).group_by(Incident.category).all()
        category_dist = {category: count for category, count in categories}
        
        # Average resolution time
        resolved_incidents = db.query(Incident).filter(Incident.resolution_time_minutes.isnot(None)).all()
        avg_resolution_time = sum(inc.resolution_time_minutes for inc in resolved_incidents) / len(resolved_incidents) if resolved_incidents else 0
        
        return {
            "success": True,
            "analytics": {
                "total_incidents": total_incidents,
                "open_incidents": open_incidents,
                "resolved_today": resolved_today,
                "priority_distribution": priority_dist,
                "category_distribution": category_dist,
                "average_resolution_time": round(avg_resolution_time, 2),
                "ai_resolution_rate": 0.87,  # Mock data - would calculate from actual data
                "user_satisfaction_score": 4.6  # Mock data
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics"
        )

# Utility endpoints
@app.post("/incidents/{incident_id}/resolve", response_model=Dict[str, Any])
async def resolve_incident(
    incident_id: str,
    resolution_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Resolve an incident with resolution details"""
    try:
        incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        incident.status = "Resolved"
        incident.resolution_steps = resolution_data.get("resolution_steps", "")
        incident.resolved_at = datetime.utcnow()
        incident.updated_at = datetime.utcnow()
        
        # Calculate resolution time
        if incident.created_at:
            resolution_time = (incident.resolved_at - incident.created_at).total_seconds() / 60
            incident.resolution_time_minutes = int(resolution_time)
        
        db.commit()
        db.refresh(incident)
        
        return {
            "success": True,
            "incident": incident.to_dict(),
            "message": "Incident resolved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error resolving incident {incident_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve incident"
        )

@app.get("/categories", response_model=Dict[str, Any])
async def get_categories(db: Session = Depends(get_db)):
    """Get all incident categories"""
    try:
        categories = db.query(Incident.category).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return {
            "success": True,
            "categories": category_list
        }
        
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch categories"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
