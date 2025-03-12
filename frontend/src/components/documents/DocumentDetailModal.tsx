import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Spinner,
  useToast,
  Code
} from '@chakra-ui/react';
import { Document, IndexStatus } from '../../types/api';

interface DocumentStatusType {
  status: IndexStatus;
  lastUpdated?: string;
  error?: string;
}

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  documentStatus: DocumentStatusType | null;
  isViewOnly?: boolean;
  onSave: (id: string, updates: { title: string; content: string; source?: string }) => Promise<void>;
  onReindex: (id: string) => Promise<void>;
  isSaving: boolean;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document,
  documentStatus,
  isViewOnly = false,
  onSave,
  onReindex,
  isSaving
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [activeTab, setActiveTab] = useState(isViewOnly ? 0 : 1);
  
  const toast = useToast();
  
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setSource(document.source || '');
    }
  }, [document]);
  
  const handleSave = async () => {
    if (!document) return;
    
    if (!title || !content) {
      toast({
        title: 'Felder fehlen',
        description: 'Bitte geben Sie einen Titel und Inhalt an.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      await onSave(document.id, {
        title,
        content,
        source: source || undefined
      });
      
      toast({
        title: 'Dokument aktualisiert',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Fehler beim Speichern',
        description: 'Bitte versuchen Sie es erneut.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleReindex = async () => {
    if (!document) return;
    
    try {
      await onReindex(document.id);
      
      toast({
        title: 'Neu-Indizierung gestartet',
        description: 'Das Dokument wird jetzt neu indiziert.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Fehler bei der Neu-Indizierung',
        description: 'Bitte versuchen Sie es erneut.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  if (!document) {
    return null;
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <Text isTruncated maxW="400px" title={document.title}>
              {isViewOnly ? 'Dokument anzeigen' : 'Dokument bearbeiten'}
            </Text>
            {documentStatus && (
              <Badge 
                colorScheme={
                  documentStatus.status === IndexStatus.INDIZIERT 
                    ? 'green' 
                    : documentStatus.status === IndexStatus.FEHLER 
                        ? 'red' 
                        : 'yellow'
                }
                ml={2}
              >
                {documentStatus.status === IndexStatus.INDIZIERT 
                  ? 'Indiziert' 
                  : documentStatus.status === IndexStatus.FEHLER 
                      ? 'Fehler' 
                      : 'Nicht indiziert'}
              </Badge>
            )}
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" isFitted>
            <TabList>
              <Tab>Ansicht</Tab>
              {!isViewOnly && <Tab>Bearbeiten</Tab>}
              <Tab>Metadaten</Tab>
              <Tab>Status</Tab>
            </TabList>
            
            <TabPanels>
              {/* Ansicht Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Titel:</Text>
                    <Text fontSize="lg" fontWeight="medium">{document.title}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Inhalt:</Text>
                    <Box 
                      p={4} 
                      bg="gray.50" 
                      borderRadius="md" 
                      whiteSpace="pre-wrap" 
                      minH="200px"
                      maxH="500px"
                      overflowY="auto"
                    >
                      {document.content}
                    </Box>
                  </Box>
                  
                  {document.source && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">Quelle:</Text>
                      <Text>{document.source}</Text>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Bearbeiten Tab */}
              {!isViewOnly && (
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Titel</FormLabel>
                      <Input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Titel des Dokuments"
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Inhalt</FormLabel>
                      <Textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Inhalt des Dokuments"
                        minH="300px"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Quelle (optional)</FormLabel>
                      <Input 
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="z.B. Webseite, Handbuch, etc."
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>
              )}
              
              {/* Metadaten Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">ID:</Text>
                    <Code p={2} borderRadius="md">{document.id}</Code>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Erstellt am:</Text>
                    <Text>
                      {new Date(document.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Tenant ID:</Text>
                    <Code p={2} borderRadius="md">{document.tenant_id}</Code>
                  </Box>
                  
                  {document.doc_metadata && Object.keys(document.doc_metadata).length > 0 && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">Zusätzliche Metadaten:</Text>
                      <Code p={2} borderRadius="md" display="block" whiteSpace="pre">
                        {JSON.stringify(document.doc_metadata, null, 2)}
                      </Code>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Status Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Indizierungsstatus:</Text>
                    <HStack mt={1}>
                      {!documentStatus ? (
                        <Badge colorScheme="gray">Status unbekannt</Badge>
                      ) : documentStatus.status === IndexStatus.INDIZIERT ? (
                        <Badge colorScheme="green">Indiziert</Badge>
                      ) : documentStatus.status === IndexStatus.FEHLER ? (
                        <Badge colorScheme="red">Fehler</Badge>
                      ) : (
                        <Badge colorScheme="yellow">Nicht indiziert</Badge>
                      )}
                    </HStack>
                  </Box>
                  
                  {documentStatus?.error && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">Fehlermeldung:</Text>
                      <Box p={3} bg="red.50" color="red.600" borderRadius="md" mt={1}>
                        {documentStatus.error}
                      </Box>
                    </Box>
                  )}
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Vektorisierung:</Text>
                    <Text mt={1}>
                      {documentStatus?.status === IndexStatus.INDIZIERT
                        ? 'Das Dokument wurde erfolgreich vektorisiert und kann in der Suche verwendet werden.' 
                        : 'Das Dokument ist nicht vollständig vektorisiert oder indiziert.'}
                    </Text>
                  </Box>
                  
                  <Button 
                    onClick={handleReindex} 
                    mt={4}
                    colorScheme="purple"
                    size="sm"
                  >
                    Dokument neu indizieren
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        
        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Schließen
          </Button>
          {!isViewOnly && activeTab === 1 && (
            <Button
              colorScheme="brand"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Speichern
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DocumentDetailModal; 