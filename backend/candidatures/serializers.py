from rest_framework import serializers
from .models import Candidature, Document, Wilaya, Niveau, Domaine, Statut


class DocumentSerializer(serializers.ModelSerializer):
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'type', 'fichier_url', 'date_upload']

    def get_fichier_url(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return None


class CandidatureListSerializer(serializers.ModelSerializer):
    wilaya  = serializers.StringRelatedField()
    niveau  = serializers.StringRelatedField()
    domaine = serializers.StringRelatedField()
    statut  = serializers.StringRelatedField()
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Candidature
        fields = '__all__'


class CandidatureCreateSerializer(serializers.ModelSerializer):
    wilaya_nom  = serializers.CharField(write_only=True)
    niveau_nom  = serializers.CharField(write_only=True)
    domaine_nom = serializers.CharField(write_only=True)
    cv                = serializers.FileField(write_only=True)
    lettre_motivation = serializers.FileField(write_only=True)
    releve_notes      = serializers.FileField(write_only=True)
    adresse            = serializers.CharField(write_only=True)

    class Meta:
        model = Candidature
        fields = [
            'wilaya_nom', 'niveau_nom', 'domaine_nom',
            'prenom', 'nom', 'date_naissance', 'genre',
            'email', 'telephone', 'adresse',
            'universite', 'moyenne',
            'duree', 'date_debut', 'date_fin',
            'encadrant', 'theme', 'lettre_motivation_text',
            'cv', 'lettre_motivation', 'releve_notes', 'source',
        ]

    def validate_email(self, value):
        if Candidature.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'Une candidature avec cet email existe déjà.'
            )
        return value

    def validate_cv(self, file):
        if file.content_type != 'application/pdf':
            raise serializers.ValidationError('Le CV doit être un fichier PDF.')
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Le CV ne peut pas dépasser 5 MB.')
        return file

    def validate_lettre_motivation(self, file):
        if file.content_type != 'application/pdf':
            raise serializers.ValidationError('La lettre doit être un PDF.')
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Max 5 MB.')
        return file

    def validate_releve_notes(self, file):
        if file.content_type != 'application/pdf':
            raise serializers.ValidationError('Le relevé doit être un PDF.')
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Max 5 MB.')
        return file

    def create(self, validated_data):
        wilaya_nom  = validated_data.pop('wilaya_nom')
        niveau_nom  = validated_data.pop('niveau_nom')
        domaine_nom = validated_data.pop('domaine_nom')
        cv_file     = validated_data.pop('cv')
        lettre_file = validated_data.pop('lettre_motivation')
        releve_file = validated_data.pop('releve_notes')

        wilaya, _  = Wilaya.objects.get_or_create(nom=wilaya_nom)
        niveau, _  = Niveau.objects.get_or_create(
            nom=niveau_nom,
            defaults={'type': self._get_type(niveau_nom)}
        )
        domaine, _ = Domaine.objects.get_or_create(nom=domaine_nom)
        statut, _  = Statut.objects.get_or_create(nom='Preselected')

        candidature = Candidature.objects.create(
            wilaya=wilaya,
            niveau=niveau,
            domaine=domaine,
            statut=statut,
            **validated_data
        )

        Document.objects.create(
            candidature=candidature,
            type=Document.Type.CV,
            fichier=cv_file
        )
        Document.objects.create(
            candidature=candidature,
            type=Document.Type.LETTRE,
            fichier=lettre_file
        )
        Document.objects.create(
            candidature=candidature,
            type=Document.Type.RELEVE,
            fichier=releve_file
        )

        return candidature

    def _get_type(self, nom):
        nom_lower = nom.lower()
        if 'licence' in nom_lower: return 'Licence'
        elif 'master' in nom_lower: return 'Master'
        elif 'ingénieur' in nom_lower: return 'Ingénieur'
        elif 'doctorat' in nom_lower: return 'Doctorat'
        return 'Licence'


class CandidatureUpdateStatutSerializer(serializers.ModelSerializer):
    statut_nom = serializers.CharField(write_only=True)

    class Meta:
        model = Candidature
        fields = ['statut_nom']

    def update(self, instance, validated_data):
        statut_nom = validated_data.pop('statut_nom')
        statut, _ = Statut.objects.get_or_create(nom=statut_nom)
        instance.statut = statut
        instance.save()
        return instance