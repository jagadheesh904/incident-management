import logging
from typing import Dict, Any
import random

logger = logging.getLogger(__name__)

class SimpleLLMHandler:
    def __init__(self):
        self.model_name = "mock-gemini"
        logger.info("Initialized Simple LLM Handler with mock responses")
    
    def generate_enhanced_response(self, prompt: str, context: Dict = None) -> Dict[str, Any]:
        """Generate mock response for testing"""
        prompt_lower = prompt.lower()
        
        # Mock responses based on common IT issues
        if 'outlook' in prompt_lower or 'email' in prompt_lower:
            response = """I understand you're having issues with Outlook. Let me help you troubleshoot this.

**Common Solutions:**
1. Restart Outlook completely
2. Check your internet connection
3. Verify your email account settings
4. Clear the Outlook cache

**To help further, could you tell me:**
- What specific error message are you seeing?
- When did this issue start?
- Are you using Windows or Mac?"""
            
            return {
                "response": response,
                "type": "clarification",
                "confidence": 0.85,
                "suggested_actions": ["Restart Outlook", "Check Error Message", "Verify Settings"],
                "requires_clarification": True,
                "estimated_resolution_time": 20,
                "sentiment": "positive"
            }
        
        elif 'vpn' in prompt_lower:
            response = """I see you're experiencing VPN connection problems. Here are some steps to try:

**Troubleshooting Steps:**
1. Check your internet connection
2. Restart the VPN client
3. Verify your login credentials
4. Try connecting to a different server

**Which VPN client are you using?**
- Cisco AnyConnect
- GlobalProtect
- FortiClient
- Other"""

            return {
                "response": response,
                "type": "clarification", 
                "confidence": 0.88,
                "suggested_actions": ["Restart VPN", "Check Internet", "Verify Credentials"],
                "requires_clarification": True,
                "estimated_resolution_time": 25,
                "sentiment": "positive"
            }
        
        elif 'password' in prompt_lower:
            response = """I can help with password reset. For security, I'll guide you through the proper process.

**Password Reset Options:**
1. Self-service portal: password.sigmoid.com
2. Contact IT helpdesk for immediate assistance
3. Use the "Forgot Password" feature in the application

**To proceed, I need:**
- Your employee ID
- Which system requires reset (Windows, Email, VPN, etc.)"""

            return {
                "response": response,
                "type": "verification",
                "confidence": 0.92,
                "suggested_actions": ["Use Self-Service", "Contact Helpdesk", "Provide Employee ID"],
                "requires_clarification": True,
                "estimated_resolution_time": 10,
                "sentiment": "neutral"
            }
        
        elif 'slow' in prompt_lower or 'performance' in prompt_lower:
            response = """For performance issues, here are some quick optimizations:

**Immediate Steps:**
1. Close unused applications and browser tabs
2. Restart your computer
3. Check for system updates
4. Clear temporary files

**To provide better assistance:**
- Which applications are running slow?
- How long has this been happening?
- What's your device model and OS?"""

            return {
                "response": response,
                "type": "clarification",
                "confidence": 0.80,
                "suggested_actions": ["Restart Computer", "Close Applications", "Check Updates"],
                "requires_clarification": True,
                "estimated_resolution_time": 30,
                "sentiment": "positive"
            }
        
        else:
            response = """Thank you for your message! I understand you're experiencing an issue.

To help you effectively, please provide:
1. A detailed description of the problem
2. When the issue started occurring
3. Any error messages you're seeing
4. What you've already tried

I'm here to help resolve this quickly!"""

            return {
                "response": response,
                "type": "clarification",
                "confidence": 0.75,
                "suggested_actions": ["Describe the Issue", "Share Error Details", "Explain What Happened"],
                "requires_clarification": True,
                "estimated_resolution_time": 30,
                "sentiment": "positive"
            }

# Global instance
simple_llm_handler = SimpleLLMHandler()
