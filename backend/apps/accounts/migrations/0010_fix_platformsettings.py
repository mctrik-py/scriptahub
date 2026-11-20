
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
                        DO $$
                        BEGIN
                            IF EXISTS (
                                SELECT 1
                                FROM information_schema.columns
                                WHERE table_name = 'accounts_platformsettings'
                                AND column_name = 'find_writer_enabled'
                            )
                            AND NOT EXISTS (
                                SELECT 1
                                FROM information_schema.columns
                                WHERE table_name = 'accounts_platformsettings'
                                AND column_name = 'is_find_writer_locked'
                            )
                            THEN
                                ALTER TABLE accounts_platformsettings
                                RENAME COLUMN find_writer_enabled
                                TO is_find_writer_locked;
                            END IF;
                        END $$;
                    """,
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[],
        ),
    ]