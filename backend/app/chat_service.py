import logging
from sqlalchemy.orm import Session
from app.models import ChatSession, ChatMessage
from app.llm_handler_enhanced import enhanced_llm_handler
from app.kb_processor import kb_processor
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        pass

    def create_session(self, db: Session, user_id: int = 1):
        """Create a new chat session"""
        try:
            session_id = str(uuid.uuid4())
            
            session = ChatSession(
                session_id=session_id,
                user_id=user_id,
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
                content="Hello! I'm SigmaAI, your IT support assistant. I'm here to help you resolve any technical issues. Could you please describe what problem you're facing?",
                message_metadata={
                    "type": "welcome",
                    "suggested_actions": ["Outlook issues", "VPN problems", "Password reset", "Software installation"],
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
            return {
                "success": False,
                "error": str(e)
            }

    def send_message(self, db: Session, session_id: str, user_message: str):
        """Process user message and return AI response"""
        try:
            # Get session
            session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            if not session:
                return {
                    "success": False,
                    "error": "Chat session not found"
                }
            
            # Save user message
            user_msg = ChatMessage(
                session_id=session_id,
                message_type="user",
                content=user_message
            )
            db.add(user_msg)
            db.commit()
            
            # Get conversation history
            history = self._get_conversation_history(session_id, db)
            
            # Find matching KB entries
            kb_matches = kb_processor.find_matching_kb_entries(user_message, db)
            
            # Prepare context
            context = {
                "session_data": session.to_dict(),
                "kb_entries": kb_matches,
                "conversation_history": history,
                "user_data": {
                    "full_name": "Demo User",
                    "department": "IT", 
                    "role": "User"
                }
            }
            
            # Generate AI response
            ai_response = enhanced_llm_handler.generate_enhanced_response(user_message, context)
            
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
                    "estimated_resolution_time": ai_response.get("estimated_resolution_time", 30),
                    "enhanced_features": True
                }
            )
            db.add(bot_msg)
            db.commit()
            
            return {
                "success": True,
                "user_message": user_msg.to_dict(),
                "bot_response": bot_msg.to_dict(),
                "session_updated": session.to_dict()
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error processing chat message: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _get_conversation_history(self, session_id: str, db: Session, limit: int = 10):
        """Get conversation history for context"""
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()
        
        history = []
        for msg in reversed(messages):
            history.append({
                "type": msg.message_type,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
            })
        
        return history

    def get_messages(self, db: Session, session_id: str, limit: int = 100):
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
            return {
                "success": False,
                "error": str(e)
            }

# Global instance
chat_service = ChatService()
