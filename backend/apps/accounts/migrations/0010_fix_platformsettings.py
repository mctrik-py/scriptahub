
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_platformsettings'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE accounts_platformsettings
                        RENAME COLUMN find_writer_enabled
                        TO is_find_writer_locked;
                    """,
                    reverse_sql="""
                        ALTER TABLE accounts_platformsettings
                        RENAME COLUMN is_find_writer_locked
                        TO find_writer_enabled;
                    """
                ),
            ],
            state_operations=[],
        ),
    ]
