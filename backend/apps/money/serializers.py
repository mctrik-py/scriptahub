from rest_framework import serializers
from .models import Wallet, WalletTransaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ["id", "kind", "amount_kobo", "note", "created_at"]

class WalletSerializer(serializers.ModelSerializer):
    transactions = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ["id", "available_kobo", "escrow_kobo", "transactions"]

    def get_transactions(self, obj):
        # Get last 5 transactions
        txns = obj.txns.order_by("-created_at")[:5]
        return TransactionSerializer(txns, many=True).data