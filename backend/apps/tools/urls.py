from django.urls import path
from .views import GenerateTopicsView, GenerateOutlineView, AiChatView, PlagiarismCheckView

urlpatterns = [
    path('ai/topics/', GenerateTopicsView.as_view(), name='generate-topics'),
    path('ai/outline/', GenerateOutlineView.as_view(), name='generate-outline'),
    path('ai/chat/', AiChatView.as_view(), name='ai-chat'),
    path('plagiarism/check/', PlagiarismCheckView.as_view(), name='plagiarism-check'),
]