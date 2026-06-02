import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_analysis', '0001_initial'),
        ('candidatures', '0004_alter_evaluation_note_globale'),
    ]

    operations = [
        migrations.CreateModel(
            name='ScoreCV',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score_cv', models.DecimalField(decimal_places=1, max_digits=5)),
                ('level', models.CharField(max_length=20)),
                ('domaine', models.CharField(blank=True, max_length=100)),
                ('score_competences', models.DecimalField(decimal_places=1, max_digits=5)),
                ('score_formation', models.DecimalField(decimal_places=1, max_digits=5)),
                ('score_experience', models.DecimalField(decimal_places=1, max_digits=5)),
                ('score_soft_skills', models.DecimalField(decimal_places=1, max_digits=5)),
                ('bonus_certifications', models.DecimalField(decimal_places=1, default=0, max_digits=4)),
                ('bonus_projets', models.DecimalField(decimal_places=1, default=0, max_digits=4)),
                ('date_calcul', models.DateTimeField(auto_now_add=True)),
                ('candidature', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='score_cv',
                    to='candidatures.candidature',
                )),
            ],
            options={
                'verbose_name': 'Score CV',
            },
        ),
    ]
