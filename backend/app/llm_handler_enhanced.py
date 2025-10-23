import google.generativeai as genai
from app.config import settings
import logging
import json
import re
from typing import Dict, List, Any, Optional
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

class EnhancedLLMHandler:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Google Gemini model with enhanced configuration"""
        try:
            if not self.api_key:
                logger.warning("Google API key not found. Using enhanced mock responses.")
                return
            
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(
                self.model_name,
                generation_config={
                    "temperature": 0.2,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                },
                safety_settings=[
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                ]
            )
            logger.info(f"Enhanced Gemini model initialized: {self.model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize enhanced Gemini model: {e}")
            self.model = None
    
    def generate_enhanced_response(self, prompt: str, context: Dict = None) -> Dict[str, Any]:
        """
        Generate enhanced response using Gemini with structured output
        """
        if not self.model or not self.api_key:
            return self._generate_enhanced_mock_response(prompt, context)
        
        try:
            full_prompt = self._build_enhanced_prompt(prompt, context)
            
            response = self.model.generate_content(full_prompt)
            
            return self._parse_enhanced_ai_response(response.text, context)
            
        except Exception as e:
            logger.error(f"Error generating enhanced AI response: {e}")
            return self._generate_enhanced_fallback_response(prompt, context)
    
    def _build_enhanced_prompt(self, prompt: str, context: Dict) -> str:
        """Build comprehensive enhanced prompt with context"""
        system_prompt = self._get_enhanced_system_prompt(context)
        
        # Add conversation history
        if context and context.get('conversation_history'):
            conversation = "\n".join([
                f"{'User' if msg['type'] == 'user' else 'Assistant'}: {msg['content']}"
                for msg in context['conversation_history'][-8:]  # Last 8 messages for better context
            ])
            conversation_context = f"\n\n## Conversation History:\n{conversation}"
        else:
            conversation_context = ""
        
        # Add user context if available
        user_context = ""
        if context and context.get('user_data'):
            user = context['user_data']
            user_context = f"\n\n## User Context:\n- Name: {user.get('full_name', 'User')}\n- Department: {user.get('department', 'Unknown')}\n- Role: {user.get('role', 'User')}"
        
        # Add KB context
        kb_context = ""
        if context and context.get('kb_entries'):
            kb_context = "\n\n## Relevant Knowledge Base:\n"
            for i, kb in enumerate(context['kb_entries'][:3]):  # Top 3 most relevant
                kb_context += f"\n{i+1}. {kb.get('use_case', '')}\n   Required: {', '.join([info.get('field', '') for info in kb.get('required_info', [])])}\n"
        
        return f"""{system_prompt}{user_context}{kb_context}{conversation_context}

## Current User Query:
{prompt}

## Assistant Response:
"""
    
    def _get_enhanced_system_prompt(self, context: Dict) -> str:
        """Get enhanced system prompt"""
        return """You are SigmaAI, an expert IT support assistant for Sigmoid Services. You help users resolve technical issues and create detailed incident reports.

## RESPONSE GUIDELINES:
1. **BE EMPATHETIC**: Acknowledge user's frustration and show understanding
2. **BE PROACTIVE**: Anticipate follow-up questions and provide complete information
3. **BE STRUCTURED**: Use clear formatting with bullet points and steps
4. **BE PRECISE**: Provide specific, actionable advice
5. **BE CONFIDENT**: Show confidence in your solutions
6. **BE CONVERSATIONAL**: Use natural, friendly language

## RESPONSE STRUCTURE:
- Start with empathetic acknowledgment
- Provide clear, step-by-step guidance
- Ask clarifying questions when needed
- Suggest next steps and expectations
- End with encouraging closing

## AVAILABLE ACTIONS:
- Create new incident
- Provide immediate solution
- Ask clarifying questions
- Escalate to human agent
- Check knowledge base
- Provide troubleshooting steps

## FORMATTING:
- Use **bold** for important terms
- Use bullet points for steps
- Use numbered lists for procedures
- Separate sections with line breaks

Always maintain a professional yet friendly tone. If you're unsure, admit it and offer to escalate."""
    
    def _parse_enhanced_ai_response(self, response_text: str, context: Dict) -> Dict[str, Any]:
        """Parse enhanced AI response into structured format"""
        try:
            # Enhanced parsing with better structure detection
            lines = response_text.strip().split('\n')
            cleaned_response = []
            suggested_actions = []
            requires_clarification = False
            confidence = 0.9
            
            # Analyze response for structure and content
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Detect questions (indicates need for clarification)
                if any(q_word in line.lower() for q_word in ['?', 'what', 'which', 'when', 'where', 'how', 'could you', 'can you', 'please provide']):
                    requires_clarification = True
                
                # Extract suggested actions
                action_patterns = [
                    r'restart (?:your|the) (\w+)',
                    r'check (?:your|the) (\w+)',
                    r'verify (?:your|the) (\w+)',
                    r'update (?:your|the) (\w+)',
                    r'contact (\w+)',
                    r'escalate to (\w+)',
                    r'reset (?:your|the) (\w+)',
                    r'install (?:the|a) (\w+)'
                ]
                
                for pattern in action_patterns:
                    matches = re.findall(pattern, line.lower())
                    suggested_actions.extend(matches)
                
                cleaned_response.append(line)
            
            # Clean up suggested actions
            suggested_actions = list(set([action.title() for action in suggested_actions if len(action) > 2]))[:4]
            
            # If no specific actions detected but response is long, add generic ones
            if not suggested_actions and len(cleaned_response) > 3:
                suggested_actions = ["Follow the steps above", "Provide more details if needed"]
            
            # Determine response type based on content
            response_type = "information"
            if requires_clarification:
                response_type = "clarification"
            elif any(word in response_text.lower() for word in ['escalate', 'agent', 'human', 'specialist']):
                response_type = "escalation"
            elif any(word in response_text.lower() for word in ['step', 'procedure', 'guide', 'tutorial']):
                response_type = "instructions"
            
            # Calculate confidence based on response characteristics
            if requires_clarification:
                confidence = 0.7
            elif len(cleaned_response) < 2:
                confidence = 0.6
            elif len([line for line in cleaned_response if len(line) > 20]) < 2:
                confidence = 0.75
            
            return {
                "response": '\n'.join(cleaned_response),
                "type": response_type,
                "confidence": min(confidence, 0.95),
                "suggested_actions": suggested_actions,
                "requires_clarification": requires_clarification,
                "next_steps": self._extract_enhanced_next_steps(response_text),
                "estimated_resolution_time": self._estimate_resolution_time(response_text),
                "sentiment": self._analyze_response_sentiment(response_text)
            }
            
        except Exception as e:
            logger.error(f"Error parsing enhanced AI response: {e}")
            return {
                "response": response_text.strip(),
                "type": "information",
                "confidence": 0.7,
                "suggested_actions": ["Contact support if issue persists"],
                "requires_clarification": False,
                "next_steps": ["Review the provided information"],
                "estimated_resolution_time": 30,
                "sentiment": "neutral"
            }
    
    def _extract_enhanced_next_steps(self, text: str) -> List[str]:
        """Extract next steps from response with better accuracy"""
        steps = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Look for numbered steps or bullet points
            if (re.match(r'^\d+\.', line) or re.match(r'^[•\-]\s', line) or 
                re.match(r'^step\s+\d+', line.lower())):
                clean_step = re.sub(r'^\d+\.\s*|[•\-]\s*|^step\s+\d+\s*', '', line, flags=re.IGNORECASE)
                if len(clean_step) > 10:  # Only include substantial steps
                    steps.append(clean_step)
        
        return steps[:4] if steps else ["Monitor the situation", "Report back if issue continues"]
    
    def _estimate_resolution_time(self, text: str) -> int:
        """Estimate resolution time in minutes based on response content"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['immediately', 'instant', 'right away', 'quick']):
            return 5
        elif any(word in text_lower for word in ['simple', 'easy', 'few minutes', 'restart']):
            return 15
        elif any(word in text_lower for word in ['complex', 'escalate', 'specialist', 'engineer']):
            return 120
        elif any(word in text_lower for word in ['multiple steps', 'procedure', 'configure']):
            return 45
        else:
            return 30
    
    def _analyze_response_sentiment(self, text: str) -> str:
        """Analyze the sentiment of the AI response"""
        positive_words = ['great', 'excellent', 'perfect', 'wonderful', 'happy', 'glad', 'easy', 'simple', 'quick', 'resolved']
        negative_words = ['unfortunately', 'sorry', 'apologize', 'complex', 'difficult', 'escalate', 'specialist']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _generate_enhanced_mock_response(self, prompt: str, context: Dict) -> Dict[str, Any]:
        """Generate enhanced mock response when AI is not available"""
        prompt_lower = prompt.lower()
        current_time = datetime.now().strftime("%H:%M")
        
        # Enhanced mock responses with better structure
        if 'outlook' in prompt_lower:
            return {
                "response": f"""I understand you're having issues with Outlook. This is a common issue we can resolve quickly.

**Immediate steps to try:**
1. First, completely close Outlook (check Task Manager to ensure it's not running in background)
2. Press Windows Key + R, type 'outlook.exe /safe' and press Enter
3. If Outlook opens in safe mode, the issue might be with an add-in

**To help you further, I need to know:**
• What operating system are you using? (Windows 10/11, macOS)
• Are you seeing any specific error messages or codes?
• When did this issue start occurring?

This will help me provide the most accurate solution for your situation.""",
                "type": "clarification",
                "confidence": 0.85,
                "suggested_actions": ["Restart Outlook", "Check Error Messages", "Provide OS Details"],
                "requires_clarification": True,
                "next_steps": ["Try safe mode", "Note any error codes", "Report back with system details"],
                "estimated_resolution_time": 20,
                "sentiment": "positive"
            }
        elif 'vpn' in prompt_lower:
            return {
                "response": f"""I see you're experiencing VPN connection problems. Let's troubleshoot this step by step.

**Quick troubleshooting:**
1. Check your internet connection - try accessing other websites
2. Restart your VPN client completely
3. Verify your login credentials are correct

**Common solutions:**
• If using GlobalProtect, try switching to a different portal
• For Cisco VPN, clear the cache and reconnect
• Check if you're on the corporate network or need to switch

**To provide better assistance:**
• Which VPN client are you using? (Cisco, GlobalProtect, FortiClient, etc.)
• What error message are you seeing, if any?
• Are you connecting from office or remote location?

We'll get this sorted out quickly!""",
                "type": "clarification", 
                "confidence": 0.88,
                "suggested_actions": ["Restart VPN", "Check Internet", "Verify Credentials"],
                "requires_clarification": True,
                "next_steps": ["Identify VPN client", "Note error messages", "Try basic troubleshooting"],
                "estimated_resolution_time": 25,
                "sentiment": "positive"
            }
        elif 'password' in prompt_lower:
            return {
                "response": f"""I can help you with password reset. For security, I'll guide you through the proper process.

**Password Reset Options:**
1. **Self-service portal**: Visit password.sigmoid.com to reset immediately
2. **Email reset**: Check your email for reset links (may take 2-5 minutes)
3. **Admin assistance**: If above options don't work, I can create a ticket

**To proceed, I need:**
• Your employee ID or email address
• Which system requires reset? (Windows, Email, VPN, etc.)
• Have you tried the self-service portal?

Your security is our priority, so I'll make sure this is handled properly.""",
                "type": "verification",
                "confidence": 0.92,
                "suggested_actions": ["Use Self-Service", "Check Email", "Verify Identity"],
                "requires_clarification": True,
                "next_steps": ["Try self-service portal", "Check email for reset links", "Provide verification details"],
                "estimated_resolution_time": 10,
                "sentiment": "neutral"
            }
        else:
            return {
                "response": f"""Thank you for reaching out. I want to make sure I understand your issue completely to provide the best assistance.

**To help you effectively, please provide:**
1. A detailed description of what's happening
2. When the issue started occurring
3. Any error messages you're seeing
4. What you've already tried to resolve it

**I can help with:**
• Software and application issues
• Hardware and performance problems
• Network and connectivity concerns
• Account and access requests
• And much more!

The more details you provide, the better I can assist you.""",
                "type": "clarification",
                "confidence": 0.8,
                "suggested_actions": ["Describe the Issue", "Share Error Details", "Explain What You've Tried"],
                "requires_clarification": True,
                "next_steps": ["Provide detailed description", "Note error messages", "Share troubleshooting attempts"],
                "estimated_resolution_time": 30,
                "sentiment": "positive"
            }
    
    def _generate_enhanced_fallback_response(self, prompt: str, context: Dict) -> Dict[str, Any]:
        """Generate enhanced fallback response when AI fails"""
        return {
            "response": """I apologize, but I'm experiencing some technical difficulties at the moment. 

**Don't worry though - here's how we can proceed:**

**Immediate options:**
1. **Try again in a moment** - The issue might be temporary
2. **Use our knowledge base** - Search for solutions in our help articles
3. **Create a manual ticket** - I can help you fill out an incident form

**In the meantime, you can:**
• Check our status page for system updates
• Browse common solutions in our knowledge base
• Try the basic troubleshooting steps for your issue

I'm here to help however I can! Please try your question again or let me know if you'd like to create a ticket manually.""",
            "type": "fallback",
            "confidence": 0.5,
            "suggested_actions": ["Retry Question", "Check Knowledge Base", "Create Manual Ticket"],
            "requires_clarification": True,
            "next_steps": ["Wait a moment and retry", "Browse knowledge base", "Create incident if urgent"],
            "estimated_resolution_time": 5,
            "sentiment": "neutral"
        }
    
    def analyze_advanced_sentiment(self, text: str) -> Dict[str, Any]:
        """Perform advanced sentiment analysis"""
        if not self.model or not self.api_key:
            return self._mock_advanced_sentiment_analysis(text)
        
        try:
            prompt = f"""Analyze the sentiment and urgency of this user message. Return ONLY a JSON response with this exact structure:
            {{
                "sentiment": "positive|neutral|negative|frustrated|urgent",
                "sentiment_score": 0.0 to 1.0,
                "urgency_level": "low|medium|high|critical",
                "urgency_score": 0.0 to 1.0,
                "key_emotions": ["emotion1", "emotion2", "emotion3"],
                "requires_immediate_attention": true|false,
                "recommended_priority": "low|medium|high|critical"
            }}
            
            User message: "{text}"
            """
            
            response = self.model.generate_content(prompt)
            return json.loads(response.text.strip())
            
        except Exception as e:
            logger.error(f"Error in advanced sentiment analysis: {e}")
            return self._mock_advanced_sentiment_analysis(text)
    
    def _mock_advanced_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """Mock advanced sentiment analysis"""
        text_lower = text.lower()
        
        # Sentiment detection
        positive_words = ['thanks', 'thank you', 'great', 'good', 'working', 'fixed', 'helpful']
        negative_words = ['not working', 'broken', 'failed', 'error', 'issue', 'problem', 'help']
        frustrated_words = ['again', 'still', 'waiting', 'frustrated', 'angry', 'annoying', 'useless']
        urgent_words = ['immediately', 'asap', 'now', 'critical', 'emergency', 'urgent', 'blocked']
        
        sentiment = "neutral"
        sentiment_score = 0.5
        urgency = "low"
        urgency_score = 0.3
        emotions = []
        immediate_attention = False
        recommended_priority = "medium"
        
        # Determine sentiment
        if any(word in text_lower for word in frustrated_words):
            sentiment = "frustrated"
            sentiment_score = 0.8
            urgency = "high"
            urgency_score = 0.8
            emotions = ["frustration", "impatience", "disappointment"]
            immediate_attention = True
            recommended_priority = "high"
        elif any(word in text_lower for word in urgent_words):
            sentiment = "urgent"
            sentiment_score = 0.9
            urgency = "critical"
            urgency_score = 0.95
            emotions = ["urgency", "concern", "anxiety"]
            immediate_attention = True
            recommended_priority = "critical"
        elif any(word in text_lower for word in negative_words):
            sentiment = "negative"
            sentiment_score = 0.7
            urgency = "medium"
            urgency_score = 0.6
            emotions = ["concern", "confusion", "frustration"]
            recommended_priority = "medium"
        elif any(word in text_lower for word in positive_words):
            sentiment = "positive"
            sentiment_score = 0.8
            emotions = ["satisfaction", "gratitude", "relief"]
        
        return {
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "urgency_level": urgency,
            "urgency_score": urgency_score,
            "key_emotions": emotions,
            "requires_immediate_attention": immediate_attention,
            "recommended_priority": recommended_priority
        }

# Global enhanced instance
enhanced_llm_handler = EnhancedLLMHandler()
