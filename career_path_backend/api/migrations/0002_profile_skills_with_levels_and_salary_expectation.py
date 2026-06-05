from django.db import migrations, models


def migrate_existing_skills(apps, schema_editor):
    Profile = apps.get_model('api', 'Profile')
    for profile in Profile.objects.all().iterator():
        if profile.skills_with_levels:
            continue
        if not profile.skills:
            continue

        skill_map = {}
        for item in profile.skills.split(','):
            skill = item.strip()
            if skill:
                skill_map[skill] = 'basic'

        if skill_map:
            profile.skills_with_levels = skill_map
            profile.save(update_fields=['skills_with_levels'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='salary_expectation',
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='skills_with_levels',
            field=models.JSONField(blank=True, default=dict, help_text='Map of skill to proficiency (basic/intermediate/expert)'),
        ),
        migrations.RunPython(migrate_existing_skills, migrations.RunPython.noop),
    ]
