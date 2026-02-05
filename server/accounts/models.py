from django.db import models

class Account(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address1 = models.CharField(max_length=255)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    phone = models.CharField(null=False)    # IntegerField removes leading zeros

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name_plural = "accounts"