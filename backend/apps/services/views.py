import os
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from groq import Groq
from django.utils import timezone
from .models import Engagement, ChatMessage, Document, ServiceType, Group, GroupMember, GroupChat
from .serializers import EngagementSerializer
from apps.accounts.models import User, Notification, WriterProfile
from apps.money.models import Wallet, WalletTransaction, Payment
import cloudinary.uploader

groq_api_key = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=groq_api_key) if groq_api_key else None

# --- ENGAGEMENT VIEWS ---

class EngagementListView(generics.ListAPIView):
    serializer_class = EngagementSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Engagement.objects.filter(student=self.request.user).order_by("-created_at")

class EngagementDetailView(generics.RetrieveAPIView):
    serializer_class = EngagementSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        if self.request.user.role == "mentor":
            return Engagement.objects.filter(mentor=self.request.user)
        return Engagement.objects.filter(student=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        # Update last_active whenever a user views a project
        request.user.last_active = timezone.now()
        request.user.save()
        
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
class MentorEngagementListView(generics.ListAPIView):
    serializer_class = EngagementSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Engagement.objects.filter(mentor=self.request.user).order_by("-created_at")

class ChatMessageCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, engagement_id):
        message_text = request.data.get("message")
        if not message_text:
            return Response({"error": "Message required"}, status=400)
        engagement = Engagement.objects.get(id=engagement_id)
        msg = ChatMessage.objects.create(
            engagement=engagement,
            sender=request.user,
            message=message_text
        )
        request.user.last_active = timezone.now()
        request.user.save()
        return Response({"status": "sent", "id": msg.id})

class ChatMessageUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, pk):
        try:
            msg = ChatMessage.objects.get(id=pk, sender=request.user)
            msg.message = request.data.get("message", msg.message)
            msg.save()
            return Response({"status": "edited"})
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=404)

    def delete(self, request, pk):
        try:
            msg = ChatMessage.objects.get(id=pk, sender=request.user)
            msg.delete()
            return Response({"status": "deleted"})
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=404)

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, engagement_id):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)
        try:
            engagement = Engagement.objects.get(id=engagement_id)
            
            is_audio = file.content_type.startswith("audio/")
            resource_type = "auto" if is_audio else "raw"
            
            upload_result = cloudinary.uploader.upload(file, resource_type=resource_type, folder="documents")
            file_url = upload_result.get("secure_url")
            
            # If it's NOT audio, save it to the Document model
            if not is_audio:
                Document.objects.create(
                    engagement=engagement,
                    file=file_url,
                    original_name=file.name,
                    uploaded_by=request.user
                )
            
            prefix = "🎤 Voice note:" if is_audio else "📎 Sent a file:"
            
            msg = ChatMessage.objects.create(
                engagement=engagement,
                sender=request.user,
                message=f"{prefix} {file.name}"
            )
            
            other_party = engagement.mentor if request.user == engagement.student else engagement.student
            if other_party:
                Notification.objects.create(
                    user=other_party,
                    title="New Message",
                    message=f"{request.user.username} sent a {'voice note' if is_audio else 'file'}"
                )
                
            return Response({"status": "uploaded", "url": file_url, "filename": file.name, "message_id": msg.id}, status=201)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Upload failed: {str(e)}"}, status=500)

class DocumentDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        try:
            doc = Document.objects.get(id=pk, uploaded_by=request.user)
            doc.delete()
            return Response({"status": "deleted"})
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=404)

class ProjectRequestView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            request_type = request.data.get("request_type") 
            title = request.data.get("title", "Untitled Project")
            description = request.data.get("description", "")
            if request_type == "find_writer":
                service, _ = ServiceType.objects.get_or_create(code="mentorship", defaults={"name": "Mentorship"})
            else:
                service, _ = ServiceType.objects.get_or_create(code="writing", defaults={"name": "Full Writing"})
            engagement = Engagement.objects.create(
                student=request.user, service_type=service, title=title, description=description,
                status=Engagement.Status.PENDING_APPROVAL, total_kobo=0
            )
            Notification.objects.create(
                user=request.user, title="Project Request Submitted",
                message=f"Your request for '{title}' has been submitted and is being processed."
            )
            return Response({"message": "Request submitted.", "id": engagement.id}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class UnassignedProjectsView(generics.ListAPIView):
    serializer_class = EngagementSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        is_pro = "@scriptahub.com" in self.request.user.email
        if is_pro:
            return Engagement.objects.filter(mentor__isnull=True, status=Engagement.Status.PENDING_APPROVAL, service_type__code="writing").order_by("-created_at")
        else:
            return Engagement.objects.filter(mentor__isnull=True, status=Engagement.Status.PENDING_APPROVAL, service_type__code="mentorship").order_by("-created_at")

class MentorAcceptProjectView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        is_pro = "@scriptahub.com" in request.user.email
        max_projects = 4 if is_pro else 2
        
        active_count = Engagement.objects.filter(
            mentor=request.user, status__in=[Engagement.Status.REQUESTED, Engagement.Status.IN_PROGRESS, Engagement.Status.REVIEW]
        ).count()
        
        if active_count >= max_projects:
            return Response({"error": f"You cannot accept more than {max_projects} active projects at a time."}, status=400)
            
        try:
            engagement = Engagement.objects.get(id=pk, mentor__isnull=True)
            engagement.mentor = request.user
            engagement.status = Engagement.Status.IN_PROGRESS
            engagement.save()
            
            if engagement.total_kobo > 0:
                student_wallet, _ = Wallet.objects.get_or_create(user=engagement.student)
                mentor_wallet, _ = Wallet.objects.get_or_create(user=engagement.mentor)
                company_wallet, _ = Wallet.objects.get_or_create(user=User.objects.get(email="admin@scriptahub.com"))
                
                total = engagement.total_kobo
                company_cut = int(total * 0.10)
                mentor_cut = int(total * 0.60)
                escrow_cut = total - company_cut - mentor_cut
                
                student_wallet.escrow_kobo -= mentor_cut + company_cut
                student_wallet.save()
                company_wallet.available_kobo += company_cut
                company_wallet.save()
                mentor_wallet.available_kobo += mentor_cut
                mentor_wallet.save()
                
                WalletTransaction.objects.create(wallet=student_wallet, kind="escrow_hold", amount_kobo=-company_cut, note="10% Company Fee")
                WalletTransaction.objects.create(wallet=student_wallet, kind="escrow_hold", amount_kobo=-mentor_cut, note="60% Mentor Advance")
                WalletTransaction.objects.create(wallet=company_wallet, kind="topup", amount_kobo=company_cut, note="Project Commission")
                WalletTransaction.objects.create(wallet=mentor_wallet, kind="escrow_release", amount_kobo=mentor_cut, note=f"60% Payment for {engagement.title}")

            Notification.objects.create(
                user=engagement.student, title="Mentor Assigned!",
                message=f"A mentor has accepted your project: {engagement.title}."
            )
            return Response({"message": "Project accepted!"}, status=200)
        except Engagement.DoesNotExist:
            return Response({"error": "Project not available or already taken."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class MentorRejectProjectView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        return Response({"message": "Project rejected"}, status=200)

class MentorProjectStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        status_value = request.data.get("status")
        if not status_value:
            return Response({"error": "Status required"}, status=400)
        try:
            engagement = Engagement.objects.get(id=pk, mentor=request.user)
            engagement.status = status_value
            engagement.save()
            
            if status_value == "completed" and engagement.total_kobo > 0:
                student_wallet, _ = Wallet.objects.get_or_create(user=engagement.student)
                mentor_wallet, _ = Wallet.objects.get_or_create(user=engagement.mentor)
                
                total = engagement.total_kobo
                company_cut = int(total * 0.10)
                mentor_cut = int(total * 0.60)
                escrow_cut = total - company_cut - mentor_cut
                
                if escrow_cut > 0:
                    mentor_wallet.available_kobo += escrow_cut
                    mentor_wallet.save()
                    student_wallet.escrow_kobo -= escrow_cut
                    student_wallet.save()
                    WalletTransaction.objects.create(wallet=student_wallet, kind="escrow_release", amount_kobo=-escrow_cut, note=f"Final release for {engagement.title}")
                    WalletTransaction.objects.create(wallet=mentor_wallet, kind="escrow_release", amount_kobo=escrow_cut, note=f"Final 30% for {engagement.title}")

            Notification.objects.create(
                user=engagement.student, title="Project Status Updated",
                message=f"Your project '{engagement.title}' is now '{status_value.replace('_', ' ')}'."
            )
            return Response({"message": "Status updated"}, status=200)
        except Engagement.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

class AIMatchView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, engagement_id):
        try:
            engagement = Engagement.objects.get(id=engagement_id, student=request.user)
            mentor_profiles = []
            mentors = User.objects.filter(role="mentor")
            for m in mentors:
                try:
                    wp = m.writer_profile
                    if wp.verified:
                        is_pro = "@scriptahub.com" in m.email
                        max_projects = 4 if is_pro else 2
                        active_count = Engagement.objects.filter(
                            mentor=m, status__in=[Engagement.Status.REQUESTED, Engagement.Status.IN_PROGRESS, Engagement.Status.REVIEW]
                        ).count()
                        if active_count >= max_projects:
                            continue
                        mentor_profiles.append({
                            "id": m.id,
                            "name": m.username,
                            "specialization": wp.specialization or "General",
                            "tools": wp.tools or "Not specified",
                            "bio": wp.bio or ""
                        })
                except WriterProfile.DoesNotExist:
                    pass
            
            if not mentor_profiles:
                return Response({"error": "All mentors are currently occupied. Please try again later or use ScriptaHub mentors."}, status=404)
            
            project_text = f"{engagement.title} {engagement.description}".lower()
            scored_mentors = []
            for m in mentor_profiles:
                score = 0
                for word in m["specialization"].lower().split(", "):
                    if word and word in project_text:
                        score += 10
                for word in m["tools"].lower().split(", "):
                    if word and word in project_text:
                        score += 5
                if m["bio"]:
                    for word in m["bio"].lower().split():
                        if word and word in project_text:
                            score += 1
                scored_mentors.append({**m, "score": score})
            
            scored_mentors.sort(key=lambda x: x["score"], reverse=True)
            top_mentors = scored_mentors[:3]
            
            if client:
                try:
                    prompt = f"""Project: {engagement.title} - {engagement.description}
                    Mentors: {[{'id': m['id'], 'spec': m['specialization']} for m in mentor_profiles[:10]]}
                    Return ONLY a JSON array of the top 3 mentor IDs."""
                    response = client.chat.completions.create(
                        model="openai/gpt-oss-20b",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3, max_tokens=50, timeout=5.0,
                    )
                    import json
                    content = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
                    ai_ids = json.loads(content)
                    if isinstance(ai_ids, list) and len(ai_ids) > 0:
                        ai_mentors = [m for m in mentor_profiles if m["id"] in ai_ids][:3]
                        if ai_mentors:
                            return Response({"matched_mentors": ai_mentors})
                except Exception:
                    pass
            
            return Response({"matched_mentors": top_mentors})
        except Engagement.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class StudentAssignMentorView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, engagement_id):
        try:
            engagement = Engagement.objects.get(id=engagement_id, student=request.user)
            mentor_id = request.data.get("mentor_id")
            if not mentor_id:
                return Response({"error": "Mentor ID required"}, status=400)
            mentor = User.objects.get(id=mentor_id, role="mentor")
            engagement.mentor = mentor
            engagement.status = Engagement.Status.REQUESTED
            engagement.save()
            Notification.objects.create(user=mentor, title="New Project Request",
                message=f"Student {request.user.username} requested you for: {engagement.title}")
            Notification.objects.create(user=engagement.student, title="Mentor Request Sent",
                message=f"Your request to {mentor.username} has been sent.")
            return Response({"message": "Mentor request sent!"})
        except Engagement.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except User.DoesNotExist:
            return Response({"error": "Mentor not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class AutoAssignCompanyView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, engagement_id):
        try:
            engagement = Engagement.objects.get(id=engagement_id, student=request.user)
            pros = User.objects.filter(email__endswith="@scriptahub.com", role="mentor", writer_profile__verified=True)
            if not pros.exists():
                return Response({"error": "No company mentors available."}, status=404)
            best_pro = None
            min_active = float('inf')
            for pro in pros:
                active = Engagement.objects.filter(mentor=pro, status__in=[Engagement.Status.REQUESTED, Engagement.Status.IN_PROGRESS, Engagement.Status.REVIEW]).count()
                if active < 4 and active < min_active:
                    min_active = active
                    best_pro = pro
            if not best_pro:
                return Response({"error": "All company mentors at capacity."}, status=404)
            engagement.mentor = best_pro
            engagement.status = Engagement.Status.IN_PROGRESS
            engagement.save()
            Notification.objects.create(user=best_pro, title="New Project Assigned", message=f"You have been assigned: {engagement.title}")
            Notification.objects.create(user=engagement.student, title="Mentor Assigned!",
                message=f"You have been matched with a ScriptaHub mentor: {best_pro.username}")
            return Response({"message": f"Assigned to {best_pro.username}"})
        except Engagement.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

# --- GROUP VIEWS ---

class GroupCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        name = request.data.get("name")
        description = request.data.get("description", "")
        engagement_id = request.data.get("engagement_id")
        mentor_id = request.data.get("mentor_id")
        
        if not name:
            return Response({"error": "Group name is required"}, status=400)
        if Group.objects.filter(name__iexact=name).exists():
            return Response({"error": "A group with this name already exists."}, status=400)
        
        group = Group.objects.create(name=name, description=description, admin=request.user)
        GroupMember.objects.create(group=group, student=request.user, status=GroupMember.Status.APPROVED)
        
        mentor_added = False
        if mentor_id:
            try:
                mentor = User.objects.get(id=mentor_id, role="mentor")
                GroupMember.objects.get_or_create(group=group, student=mentor, defaults={"status": GroupMember.Status.APPROVED})
                mentor_added = True
            except User.DoesNotExist:
                pass
        
        if not mentor_added and engagement_id:
            try:
                engagement = Engagement.objects.get(id=engagement_id)
                if engagement.mentor:
                    GroupMember.objects.get_or_create(group=group, student=engagement.mentor, defaults={"status": GroupMember.Status.APPROVED})
                    mentor_added = True
            except Engagement.DoesNotExist:
                pass
        
        return Response({"message": "Group created!", "group_id": group.id, "mentor_added": mentor_added}, status=201)

class GroupSearchView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        groups = Group.objects.filter(is_public=True, status=Group.Status.OPEN)
        if query:
            groups = groups.filter(name__icontains=query)
        results = []
        for g in groups:
            if not g.admin or not g.admin.is_active:
                continue
            approved_count = g.member_requests.filter(status=GroupMember.Status.APPROVED).count()
            results.append({
                "id": g.id, "name": g.name, "description": g.description,
                "admin_name": g.admin.username,
                "members_count": approved_count, "max_members": g.max_members,
            })
        return Response(results)

class GroupJoinView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            if group.admin == request.user:
                return Response({"error": "You are the admin of this group."}, status=400)
            approved_count = group.member_requests.filter(status=GroupMember.Status.APPROVED).count()
            if approved_count >= group.max_members:
                return Response({"error": "This group is full."}, status=400)
            membership, created = GroupMember.objects.get_or_create(group=group, student=request.user, defaults={"status": GroupMember.Status.PENDING})
            if not created and membership.status == GroupMember.Status.PENDING:
                return Response({"error": "You already have a pending request."}, status=400)
            if membership.status == GroupMember.Status.APPROVED:
                return Response({"error": "You are already a member."}, status=400)
            Notification.objects.create(user=group.admin, title="New Group Join Request",
                message=f"{request.user.username} wants to join your group: {group.name}")
            return Response({"message": "Join request sent to admin."})
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)

class GroupManageView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            if group.admin != request.user:
                return Response({"error": "Only the admin can view requests."}, status=403)
            requests = group.member_requests.filter(status=GroupMember.Status.PENDING)
            pending = [{"id": r.id, "student": r.student.username, "student_id": r.student.id} for r in requests]
            approved = group.member_requests.filter(status=GroupMember.Status.APPROVED)
            members = [{"id": m.id, "username": m.student.username, "student_id": m.student.id, "is_admin": m.student == group.admin} for m in approved]
            return Response({"id": group.id, "name": group.name, "description": group.description, "pending_requests": pending, "members": members})
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)

class GroupApproveMemberView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, group_id, member_id):
        try:
            group = Group.objects.get(id=group_id)
            if group.admin != request.user:
                return Response({"error": "Only the admin can approve members."}, status=403)
            membership = GroupMember.objects.get(id=member_id, group=group, status=GroupMember.Status.PENDING)
            membership.status = GroupMember.Status.APPROVED
            membership.save()
            Notification.objects.create(user=membership.student, title="Group Request Approved",
                message=f"You have been accepted into the group: {group.name}")
            return Response({"message": "Member approved."})
        except GroupMember.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

class GroupRejectMemberView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, group_id, member_id):
        try:
            group = Group.objects.get(id=group_id)
            if group.admin != request.user:
                return Response({"error": "Only the admin can reject members."}, status=403)
            membership = GroupMember.objects.get(id=member_id, group=group, status=GroupMember.Status.PENDING)
            membership.status = GroupMember.Status.REJECTED
            membership.save()
            Notification.objects.create(user=membership.student, title="Group Request Rejected",
                message=f"Your request to join {group.name} was not accepted.")
            return Response({"message": "Member rejected."})
        except GroupMember.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

class GroupMyGroupsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        admin_groups = Group.objects.filter(admin=request.user)
        member_groups = Group.objects.filter(
            member_requests__student=request.user,
            member_requests__status=GroupMember.Status.APPROVED
        ).exclude(admin=request.user)
        result = []
        for g in admin_groups:
            result.append({"id": g.id, "name": g.name, "role": "admin", "members_count": g.member_requests.filter(status=GroupMember.Status.APPROVED).count()})
        for g in member_groups:
            result.append({"id": g.id, "name": g.name, "role": "member", "members_count": g.member_requests.filter(status=GroupMember.Status.APPROVED).count()})
        return Response(result)

class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            is_member = group.member_requests.filter(student=request.user, status=GroupMember.Status.APPROVED).exists()
            if not is_member and group.admin != request.user:
                return Response({"error": "You are not a member of this group."}, status=403)
            members = group.member_requests.filter(status=GroupMember.Status.APPROVED)
            member_list = [{"id": m.id, "username": m.student.username, "role": m.student.role} for m in members]
            return Response({"id": group.id, "name": group.name, "description": group.description, "admin_name": group.admin.username, "is_admin": group.admin == request.user, "members": member_list})
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)

class GroupDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            if group.admin != request.user:
                return Response({"error": "Only the admin can delete this group."}, status=403)
            group.delete()
            return Response({"message": "Group deleted."})
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)

class GroupListByProjectView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, engagement_id):
        try:
            engagement = Engagement.objects.get(id=engagement_id)
            if engagement.student != request.user and engagement.mentor != request.user:
                return Response({"error": "Unauthorized"}, status=403)
            groups = Group.objects.filter(
                admin=engagement.student,
                member_requests__student=engagement.mentor,
                member_requests__status=GroupMember.Status.APPROVED
            )
            result = []
            for g in groups:
                result.append({"id": g.id, "name": g.name, "members_count": g.member_requests.filter(status=GroupMember.Status.APPROVED).count()})
            return Response(result)
        except Engagement.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

class GroupChatMessageView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            is_member = group.member_requests.filter(student=request.user, status=GroupMember.Status.APPROVED).exists()
            if not is_member and group.admin != request.user:
                return Response({"error": "Not a member"}, status=403)
            messages = GroupChat.objects.filter(group=group).order_by("created_at")
            return Response({"messages": [{"id": m.id, "sender": m.sender.username, "message": m.message, "created_at": m.created_at} for m in messages]})
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)
    
    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
            is_member = group.member_requests.filter(student=request.user, status=GroupMember.Status.APPROVED).exists()
            if not is_member and group.admin != request.user:
                return Response({"error": "Not a member"}, status=403)
            
            file = request.FILES.get("file")
            message_text = request.data.get("message")
            
            if file:
                upload_result = cloudinary.uploader.upload(file, resource_type="raw", folder="group_documents")
                file_url = upload_result.get("secure_url")
                GroupChat.objects.create(
                    group=group, 
                    sender=request.user, 
                    message=f"📎 Sent a file: {file.name}|{file_url}"
                )
                return Response({"status": "file_sent"})
            
            if not message_text:
                return Response({"error": "Message required"}, status=400)
            
            GroupChat.objects.create(group=group, sender=request.user, message=message_text)
            return Response({"status": "sent"})
        except Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)
class StudentReopenProjectView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            # Ensure the project belongs to this student
            engagement = Engagement.objects.get(id=pk, student=request.user)
            
            if engagement.status != Engagement.Status.COMPLETED:
                return Response({"error": "Only completed projects can be reopened."}, status=400)
            
            # Change status back to in_progress
            engagement.status = Engagement.Status.IN_PROGRESS
            engagement.save()
            
            # Notify the mentor
            if engagement.mentor:
                Notification.objects.create(
                    user=engagement.mentor,
                    title="Project Reopened",
                    message=f"Student {request.user.username} reopened the project: {engagement.title}."
                )
            
            return Response({"message": "Project reopened successfully."}, status=200)
        except Engagement.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)