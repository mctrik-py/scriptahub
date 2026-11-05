from django.urls import path
from .views import TopicListView, TopicRequestView

urlpatterns = [
    path('topics/', TopicListView.as_view(), name='topic-list'),
    path('projects/topics/request/', TopicRequestView.as_view(), name='topic-request'),
]