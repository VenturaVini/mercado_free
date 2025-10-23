# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_order_expires_at_order_payment_method'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='installments',
            field=models.IntegerField(default=1, verbose_name='Parcelas'),
        ),
    ]
