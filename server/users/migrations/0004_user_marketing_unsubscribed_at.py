from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_normalized_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='marketing_unsubscribed_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='When the user opted out of marketing/promotional email. Null means '
                          'still subscribed. Transactional email (verification, password reset) '
                          'always sends and ignores this flag.',
            ),
        ),
    ]
