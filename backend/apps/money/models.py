from django.db import models
from django.conf import settings

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    available_kobo = models.BigIntegerField(default=0)
    escrow_kobo = models.BigIntegerField(default=0)
    company_kobo = models.BigIntegerField(default=0) # New field for company revenue

    def __str__(self):
        return f"{self.user.email}'s Wallet"

class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reference = models.CharField(max_length=80, unique=True)
    amount_kobo = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference} - {self.amount_kobo}"

class WalletTransaction(models.Model):
    class Kind(models.TextChoices):
        TOPUP = "topup", "Top Up"
        ESCROW_HOLD = "escrow_hold", "Escrow Hold"
        ESCROW_RELEASE = "escrow_release", "Escrow Release"
        PAYOUT = "payout", "Payout"
        REFUND = "refund", "Refund"

    wallet = models.ForeignKey(Wallet, related_name="txns", on_delete=models.CASCADE)
    kind = models.CharField(max_length=30, choices=Kind.choices)
    amount_kobo = models.BigIntegerField()
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.kind} - {self.amount_kobo}"