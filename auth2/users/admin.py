from django.contrib import admin
from .models import User, IPAddressRateLimit, DeviceFingerprint, RateLimitConfig

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ("email", "company_id", "is_active", "is_locked", "failed_login_attempts", "lockout_time")
	readonly_fields = ("company_id",)
	actions = ["unlock_accounts"]

	def unlock_accounts(self, request, queryset):
		updated = queryset.update(is_locked=False, failed_login_attempts=0, lockout_time=None)
		self.message_user(request, f"Unlocked {updated} account(s).")
	unlock_accounts.short_description = "Unlock selected user accounts"


@admin.register(IPAddressRateLimit)
class IPAddressRateLimitAdmin(admin.ModelAdmin):
	list_display = ("ip_address", "failed_attempts", "last_attempt", "blocked_until")
	readonly_fields = ("last_attempt",)
	list_filter = ("blocked_until", "last_attempt")
	search_fields = ("ip_address",)
	actions = ["reset_attempts", "unblock_ip"]

	def reset_attempts(self, request, queryset):
		for obj in queryset:
			obj.reset_attempts()
		self.message_user(request, f"Reset attempts for {queryset.count()} IP(s).")
	reset_attempts.short_description = "Reset failed attempts"

	def unblock_ip(self, request, queryset):
		for obj in queryset:
			obj.reset_attempts()
		self.message_user(request, f"Unblocked {queryset.count()} IP(s).")
	unblock_ip.short_description = "Unblock selected IPs"


@admin.register(DeviceFingerprint)
class DeviceFingerprintAdmin(admin.ModelAdmin):
	list_display = ("fingerprint_hash", "failed_attempts", "requires_captcha", "last_attempt", "blocked_until")
	readonly_fields = ("fingerprint_hash", "last_attempt")
	list_filter = ("requires_captcha", "blocked_until", "last_attempt")
	search_fields = ("fingerprint_hash",)
	actions = ["reset_attempts", "unblock_device"]

	def reset_attempts(self, request, queryset):
		for obj in queryset:
			obj.reset_attempts()
		self.message_user(request, f"Reset attempts for {queryset.count()} device(s).")
	reset_attempts.short_description = "Reset failed attempts"

	def unblock_device(self, request, queryset):
		for obj in queryset:
			obj.reset_attempts()
		self.message_user(request, f"Unblocked {queryset.count()} device(s).")
	unblock_device.short_description = "Unblock selected devices"


@admin.register(RateLimitConfig)
class RateLimitConfigAdmin(admin.ModelAdmin):
	fieldsets = (
		('IP-Based Rate Limiting', {
			'fields': ('ip_attempt_threshold', 'ip_block_duration_minutes')
		}),
		('Device-Based Rate Limiting', {
			'fields': ('device_attempt_threshold', 'device_captcha_threshold', 'device_block_duration_minutes')
		}),
		('General', {
			'fields': ('attempt_reset_hours',)
		}),
	)
	readonly_fields = ("created_at", "updated_at")

	def has_add_permission(self, request):
		# Only allow one configuration object
		return not RateLimitConfig.objects.exists()

	def has_delete_permission(self, request, obj=None):
		# Don't allow deleting the configuration
		return False