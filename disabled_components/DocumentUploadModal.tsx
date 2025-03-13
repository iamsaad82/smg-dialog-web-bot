// Redirect to new modular implementation
export { default } from './modals/DocumentUploadModal'; 

// Dokument mit Metadaten hochladen
const handleFormSubmit = async (values: z.infer<typeof formSchema>, 
                               e?: React.SyntheticEvent) => {
  e?.preventDefault()
  if (!isTenantSelected) return
  
  try {
    setIsSubmitting(true)
    
    const document: DocumentCreate = {
      title: values.title,
      content: values.content,
      source: values.source || undefined
    }
    
    // Dokument erstellen
    const createdDoc = await onSubmit(document)
    
    // Bei Erfolg schließen
    toast.success("Dokument erstellt")
    
    // Automatisch indizieren, wenn das Kontrollkästchen aktiviert ist
    const shouldAutoIndex = values.autoIndex === undefined ? true : values.autoIndex
    
    if (createdDoc?.id && shouldAutoIndex) {
      try {
        console.log(`Automatische Indizierung für Dokument ${createdDoc.id} gestartet...`)
        
        // Warten, damit die Datenbank Zeit hat, das Dokument zu speichern
        setTimeout(async () => {
          try {
            // Dokumenten-API verwenden, um die Indizierung anzustoßen
            await api.reindexDocument(tenantId, createdDoc.id)
            toast.success("Indizierung gestartet", {
              description: "Das Dokument wird für die Suche vorbereitet..."
            })
          } catch (indexError) {
            console.error("Fehler bei der automatischen Indizierung:", indexError)
            toast.error("Indizierung fehlgeschlagen", {
              description: "Das Dokument wurde gespeichert, konnte aber nicht indiziert werden. Sie können es später manuell indizieren."
            })
          }
        }, 1000)
      } catch (indexError) {
        console.error("Fehler bei der automatischen Indizierung:", indexError)
      }
    }
    
    if (form) {
      form.reset()
    }
    
    onClose()
  } catch (error) {
    console.error("Fehler beim Erstellen des Dokuments:", error)
    toast.error("Fehler beim Erstellen des Dokuments")
  } finally {
    setIsSubmitting(false)
  }
} 