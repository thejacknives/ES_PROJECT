from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None):
        if not email:
            raise ValueError("Users must have an email")
        if not username:
            raise ValueError("Users must have a username")

        email = self.normalize_email(email)
        user = self.model(email=email, username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password):
        user = self.create_user(email, username, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=255, unique=True)
    face_id = models.CharField(max_length=255, blank=True, null=True)
    s3_image_key = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
    



class Service(models.Model):
    name = models.CharField(max_length=100)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'services'

    def __str__(self):
        return self.name





class Appointment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.CharField(max_length=100)  # Assuming service is a string for simplicity
    datetime = models.DateTimeField(unique=True)  # ensures no overlaps
    created_at = models.DateTimeField(auto_now_add=True)
    urgency = models.BooleanField(default=False)
    state = models.CharField(max_length=50, default='started')  # started, ongoing, ended
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    '''
    def save(self, *args, **kwargs):
        # If price is not set (0.00), use the service base price
        if self.price == 0.00 and self.service:
            self.price = self.service.base_price
        super().save(*args, **kwargs)'''

    def __str__(self):
        return f"{self.user.username} - {self.service.name} at {self.datetime}"
