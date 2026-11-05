from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Wallet
from .serializers import WalletSerializer

class WalletDetailView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Auto-create a wallet if the user doesn't have one
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet