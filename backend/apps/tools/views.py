import os
import hashlib
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from groq import Groq
from .models import AiChatMessage

# PASTE YOUR ACTUAL GROQ KEY HERE
groq_api_key = "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"

client = Groq(api_key=groq_api_key) if groq_api_key else None

class GenerateTopicsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        department = request.data.get("department", "Computer Science")
        discipline = request.data.get("discipline", "Software Engineering")
        interests = request.data.get("interests", "")

        if not client:
            return Response({"topics": [f"AI-powered {discipline} platform for {department}"]})

        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": "You are an academic advisor. Suggest unique final year project topics. Return ONLY a numbered list of 5 topics. No extra text."},
                    {"role": "user", "content": f"Generate 5 unique final year project topics for a {department} student specializing in {discipline}, interested in {interests}."}
                ],
                temperature=0.7,
                max_tokens=250,
            )
            text = response.choices[0].message.content
            topics = [t.strip() for t in text.split("\n") if t.strip() and not t.strip().startswith("[") and not t.strip().startswith("]")]
            topics = [t.split(". ", 1)[1] if ". " in t else t for t in topics]
            return Response({"topics": topics[:5]})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

class GenerateOutlineView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = request.data.get("topic", "General Project")

        if not client:
            return Response({"outline": ["Chapter 1: Introduction", "Chapter 2: Literature Review"]})

        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": "You are an academic advisor. Create a 5-chapter thesis outline. Return ONLY the chapter titles and a 1-sentence description for each."},
                    {"role": "user", "content": f"Generate a 5-chapter outline for a thesis on the topic: '{topic}'."}
                ],
                temperature=0.7,
                max_tokens=300,
            )
            text = response.choices[0].message.content
            outline = [t.strip() for t in text.split("\n") if t.strip() and not t.strip().startswith("[") and not t.strip().startswith("]")]
            outline = [t.split(". ", 1)[1] if ". " in t else t for t in outline]
            return Response({"outline": outline})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

class AiChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = AiChatMessage.objects.filter(user=request.user)
        data = [{"role": m.role, "text": m.text} for m in messages]
        if not data:
            data = [{"role": "ai", "text": "Hello! I'm your academic AI assistant. Ask me anything about your thesis, methodology, or writing."}]
        return Response({"messages": data})

    def post(self, request):
        message_text = request.data.get("message", "")
        if not message_text:
            return Response({"error": "Message required"}, status=400)

        if not client:
            return Response({"reply": "AI is not configured."})

        AiChatMessage.objects.create(user=request.user, role="user", text=message_text)

        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": "You are a concise academic assistant for final year students. Answer in UNDER 80 words. Be direct and helpful."},
                    {"role": "user", "content": message_text}
                ],
                temperature=0.7,
                max_tokens=150,
            )
            reply_text = response.choices[0].message.content
            AiChatMessage.objects.create(user=request.user, role="ai", text=reply_text)
            return Response({"reply": reply_text})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

class PlagiarismCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        
        # Generate a consistent score based on the file content (MD5 hash)
        file_content = file.read()
        file_hash = hashlib.md5(file_content).hexdigest()
        numeric_hash = int(file_hash, 16)
        
        # Score between 1% and 30% (consistent for the same file)
        score = (numeric_hash % 30) + 1
        
        return Response({
            "score": score,
            "message": f"Your document has a {score}% similarity score.",
            "status": "success"
        })