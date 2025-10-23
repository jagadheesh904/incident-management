import google.generativeai as genai
from app.config import settings
import logging
import json
import re
from typing import Dict, List, Any, Optional
import requests

logger = logging.getLogger(__name__)

class LLMHandler:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Google Gemini model"""
        try:
            if not self.api_key:
                logger.warning("Google API key not found. Using mock responses.")
                return
            
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            logger.info(f"Initialized Gemini model: {self.model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            self.model = None
    
    def generate_response(self, prompt: str, context: Dict = None) -> Dict[str, Any]:
        """
        Generate response using Gemini with proper error handling
        """
        if not self.model or not self.api_key:
            return self._generate_mock_response(prompt, context)
        
        try:
            full_prompt = self._build_full_prompt(prompt, context)
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    top_p=0.8,
                    top_k=40,
                    max_output_tokens=1024,
                )
            )
            
            return self._parse_ai_response(response.text, context)
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return self._generate_fallback_response(prompt, context)
    
    def _build_full_prompt(self, prompt: str, context: Dict) -> str:
        """Build comprehensive prompt with context"""
        system_prompt = self._get_system_prompt(context)
        
        if context and context.get('conversation_history'):
            conversation = "\n".join([
                f"{'User' if msg['type'] == 'user' else 'Assistant'}: {msg['content']}"
                for msg in context['conversation_history'][-5:]  # Last 5 messages
            ])
            conversation_context = f"\n\nConversation History:\n{conversation}"
        else:
            conversation_context = ""
        
        return f"""{system_prompt}{conversation_context}

Current User Input: {prompt}

Assistant:"""
    
    def _get_system_prompt(self, context: Dict) -> str:
        """Get system prompt based on context"""
        base_prompt = """You are an expert IT support assistant for Sigmoid Services. You help users create detailed incident reports and provide immediate solutions when possible.

KEY RESPONSE GUIDELINES:
1. BE CONVERSATIONAL AND EMPATHETIC - Use natural language, show understanding
2. BE PROACTIVE - Anticipate follow-up questions and provide complete information
3. BE STRUCTURED - Organize information clearly with bullet points when helpful
4. BE ACCURATE - Only provide information you're confident about
5. BE SOLUTION-ORIENTED - Focus on resolving the user's issue

RESPONSE FORMAT:
- Start with empathetic acknowledgment
- Provide clear, step-by-step guidance
- Ask clarifying questions when needed
- End with clear next steps

AVAILABLE ACTIONS:
- Create new incident
- Provide immediate solution
- Ask clarifying questions
- Escalate to human agent
- Check knowledge base

"""
        
        if context and context.get('kb_entries'):
            kb_context = "\nKNOWLEDGE BASE CONTEXT:\n"
            for kb in context['kb_entries']:
                kb_context += f"""
Use Case: {kb.get('use_case', '')}
Required Info: {', '.join(kb.get('required_info', []))}
Solution: {kb.get('solution_steps', '')}

"""
            base_prompt += kb_context
        
        return base_prompt
    
    def _parse_ai_response(self, response_text: str, context: Dict) -> Dict[str, Any]:
        """Parse AI response into structured format"""
        try:
            # Extract JSON if present
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    structured_data = json.loads(json_match.group())
                    return structured_data
                except json.JSONDecodeError:
                    pass
            
            # Default structured response
            return {
                "response": response_text.strip(),
                "type": "information",
                "confidence": 0.9,
                "suggested_actions": self._extract_suggested_actions(response_text),
                "requires_clarification": self._needs_clarification(response_text),
                "next_steps": self._extract_next_steps(response_text)
            }
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            return {
                "response": response_text.strip(),
                "type": "information",
                "confidence": 0.7,
                "suggested_actions": [],
                "requires_clarification": False,
                "next_steps": ["Please provide more details about your issue."]
            }
    
    def _extract_suggested_actions(self, text: str) -> List[str]:
        """Extract suggested actions from response text"""
        actions = []
        action_patterns = [
            r'restart (?:your|the) (\w+)',
            r'check (?:your|the) (\w+)',
            r'verify (?:your|the) (\w+)',
            r'update (?:your|the) (\w+)',
            r'contact (\w+ support)',
            r'escalate to (\w+)'
        ]
        
        for pattern in action_patterns:
            matches = re.findall(pattern, text.lower())
            actions.extend(matches)
        
        return list(set(actions))[:3]  # Return unique actions, max 3
    
    def _needs_clarification(self, text: str) -> bool:
        """Check if response indicates need for clarification"""
        clarification_indicators = [
            'what', 'which', 'when', 'where', 'how', 'could you', 'can you',
            'please specify', 'need more information', 'clarify'
        ]
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in clarification_indicators)
    
    def _extract_next_steps(self, text: str) -> List[str]:
        """Extract next steps from response"""
        # Simple extraction - in production, use more sophisticated NLP
        sentences = re.split(r'[.!?]+', text)
        steps = [s.strip() for s in sentences if len(s.strip()) > 20][:3]  # Get first 3 substantial sentences
        return steps
    
    def _generate_mock_response(self, prompt: str, context: Dict) -> Dict[str, Any]:
        """Generate mock response when AI is not available"""
        prompt_lower = prompt.lower()
        
        # Mock responses for common issues
        if 'outlook' in prompt_lower:
            return {
                "response": "I understand you're having issues with Outlook. Let me help you troubleshoot this.\n\nFirst, could you tell me:\n1. What operating system are you using? (Windows/Mac)\n2. Are you seeing any specific error messages?\n3. When did this issue start?",
                "type": "clarification",
                "confidence": 0.8,
                "suggested_actions": ["restart outlook", "check internet connection"],
                "requires_clarification": True,
                "next_steps": ["Gather system information", "Identify error messages"]
            }
        elif 'vpn' in prompt_lower:
            return {
                "response": "I see you're experiencing VPN connection problems. This is a common issue we can resolve quickly.\n\nTo help you better:\n1. Which VPN client are you using? (Cisco, GlobalProtect, etc.)\n2. Are you connected to office WiFi or home network?\n3. What error code are you seeing, if any?",
                "type": "clarification", 
                "confidence": 0.85,
                "suggested_actions": ["restart vpn client", "check network settings"],
                "requires_clarification": True,
                "next_steps": ["Identify VPN client type", "Check network connectivity"]
            }
        elif 'password' in prompt_lower:
            return {
                "response": "I can help you with password reset. For security reasons, I'll need to verify your identity first.\n\nPlease provide:\n1. Your employee ID or email address\n2. Which system requires password reset? (Windows, Email, etc.)",
                "type": "verification",
                "confidence": 0.9,
                "suggested_actions": ["verify identity", "reset password"],
                "requires_clarification": True,
                "next_steps": ["Verify user identity", "Initiate password reset process"]
            }
        else:
            return {
                "response": "Thank you for reporting this issue. I want to make sure I understand the problem completely so I can help you effectively.\n\nCould you please provide more details about:\n1. What exactly is not working?\n2. When did you first notice this issue?\n3. Have you tried any troubleshooting steps already?",
                "type": "clarification",
                "confidence": 0.7,
                "suggested_actions": [],
                "requires_clarification": True,
                "next_steps": ["Gather incident details", "Identify problem category"]
            }
    
    def _generate_fallback_response(self, prompt: str, context: Dict) -> Dict[str, Any]:
        """Generate fallback response when AI fails"""
        return {
            "response": "I apologize, but I'm experiencing some technical difficulties. Let me help you create an incident ticket manually.\n\nPlease describe your issue in detail, and I'll make sure it gets to the right team for resolution.",
            "type": "fallback",
            "confidence": 0.5,
            "suggested_actions": ["create incident ticket"],
            "requires_clarification": True,
            "next_steps": ["Collect incident details", "Create manual ticket"]
        }
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of user input"""
        if not self.model or not self.api_key:
            return self._mock_sentiment_analysis(text)
        
        try:
            prompt = f"""Analyze the sentiment of this user message and return ONLY a JSON response with this exact structure:
            {{
                "sentiment": "positive|neutral|negative|frustrated|urgent",
                "score": 0.0 to 1.0,
                "urgency_level": "low|medium|high|critical",
                "key_emotions": ["emotion1", "emotion2"]
            }}
            
            User message: "{text}"
            """
            
            response = self.model.generate_content(prompt)
            return json.loads(response.text.strip())
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return self._mock_sentiment_analysis(text)
    
    def _mock_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """Mock sentiment analysis"""
        text_lower = text.lower()
        negative_words = ['not working', 'broken', 'failed', 'error', 'issue', 'problem', 'help', 'urgent']
        urgent_words = ['immediately', 'asap', 'now', 'critical', 'emergency']
        frustrated_words = ['again', 'still', 'waiting', 'frustrated', 'angry']
        
        sentiment = "neutral"
        score = 0.5
        urgency = "low"
        emotions = []
        
        if any(word in text_lower for word in frustrated_words):
            sentiment = "frustrated"
            score = 0.8
            urgency = "high"
            emotions = ["frustration", "impatience"]
        elif any(word in text_lower for word in urgent_words):
            sentiment = "urgent" 
            score = 0.9
            urgency = "critical"
            emotions = ["urgency", "concern"]
        elif any(word in text_lower for word in negative_words):
            sentiment = "negative"
            score = 0.7
            urgency = "medium"
            emotions = ["concern", "confusion"]
        
        return {
            "sentiment": sentiment,
            "score": score,
            "urgency_level": urgency,
            "key_emotions": emotions
        }

# Global instance
llm_handler = LLMHandler()
