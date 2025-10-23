import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class KnowledgeBaseProcessor:
    def __init__(self):
        self.initial_kb_data = [
            {
                "kb_id": "KB001",
                "use_case": "Outlook Not Opening",
                "category": "Email",
                "required_info": [
                    {"field": "operating_system", "question": "What operating system are you using?", "options": ["Windows", "Mac", "Linux"]},
                    {"field": "error_message", "question": "Are you seeing any error messages?", "options": []}
                ],
                "solution_steps": "1. Verify internet connectivity.\n2. Check Outlook version and apply updates.\n3. Clear Outlook cache and restart.\n4. Reconfigure Outlook profile if needed.",
                "common_symptoms": ["outlook not opening", "outlook won't start", "email not working"],
                "tags": ["outlook", "email", "microsoft"],
                "success_rate": 0.85
            },
            {
                "kb_id": "KB002", 
                "use_case": "VPN Connection Failure",
                "category": "Network",
                "required_info": [
                    {"field": "vpn_client", "question": "Which VPN client are you using?", "options": ["Cisco", "GlobalProtect", "FortiClient", "Other"]},
                    {"field": "network_type", "question": "Where are you connecting from?", "options": ["Office", "Home", "Public WiFi"]}
                ],
                "solution_steps": "1. Verify network connection.\n2. Restart VPN client and check updates.\n3. Clear saved credentials and retry login.\n4. Check firewall rules.",
                "common_symptoms": ["vpn not connecting", "vpn connection failed", "cannot connect to vpn"],
                "tags": ["vpn", "network", "connectivity"],
                "success_rate": 0.78
            }
        ]
    
    def initialize_knowledge_base(self, db: Session):
        """Initialize knowledge base with default data"""
        try:
            from app.models import KnowledgeBase
            
            # Check if KB already exists
            existing_count = db.query(KnowledgeBase).count()
            if existing_count > 0:
                logger.info("Knowledge base already initialized")
                return
            
            for kb_data in self.initial_kb_data:
                kb_entry = KnowledgeBase(**kb_data)
                db.add(kb_entry)
            
            db.commit()
            logger.info(f"Initialized knowledge base with {len(self.initial_kb_data)} entries")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error initializing knowledge base: {e}")
    
    def find_matching_kb_entries(self, user_input: str, db: Session, limit: int = 3) -> List[Dict]:
        """Find knowledge base entries matching user input"""
        try:
            from app.models import KnowledgeBase
            
            all_entries = db.query(KnowledgeBase).filter(KnowledgeBase.is_active == True).all()
            
            scored_entries = []
            for entry in all_entries:
                score = self._calculate_match_score(user_input, entry)
                if score > 0.1:
                    scored_entries.append((entry, score))
            
            # Sort by score and take top matches
            scored_entries.sort(key=lambda x: x[1], reverse=True)
            top_matches = scored_entries[:limit]
            
            return [
                {
                    **entry.to_dict(),
                    "match_score": score
                }
                for entry, score in top_matches
            ]
            
        except Exception as e:
            logger.error(f"Error finding matching KB entries: {e}")
            return []
    
    def _calculate_match_score(self, user_input: str, kb_entry) -> float:
        """Calculate match score between user input and KB entry"""
        user_input_lower = user_input.lower()
        score = 0.0
        
        # Check use case
        if kb_entry.use_case.lower() in user_input_lower:
            score += 0.4
        
        # Check common symptoms
        if kb_entry.common_symptoms:
            for symptom in kb_entry.common_symptoms:
                if symptom.lower() in user_input_lower:
                    score += 0.3
                    break
        
        # Check tags
        if kb_entry.tags:
            for tag in kb_entry.tags:
                if tag.lower() in user_input_lower:
                    score += 0.2
                    break
        
        return min(score, 1.0)

# Global instance
kb_processor = KnowledgeBaseProcessor()
