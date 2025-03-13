FROM semitechnologies/transformers-inference:sentence-transformers-multi-qa-MiniLM-L6-cos-v1

# Diese Umgebungsvariable wird durch render.yaml überschrieben
ENV ENABLE_CUDA='0'

# Der Port, den Render verwenden wird
EXPOSE 8080 