FROM semitechnologies/weaviate:1.24.1

# Diese Umgebungsvariablen werden durch render.yaml überschrieben
ENV PERSISTENCE_DATA_PATH='/var/lib/weaviate'
ENV ENABLE_MODULES='text2vec-transformers'
ENV AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED='true'
ENV QUERY_DEFAULTS_LIMIT=25
ENV DEFAULT_VECTORIZER_MODULE='text2vec-transformers'

# Der Port, den Render verwenden wird
EXPOSE 8080 