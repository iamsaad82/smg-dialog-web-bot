import React from 'react';
import { Box, Heading, Text, SimpleGrid, Button, useColorModeValue } from '@chakra-ui/react';

export interface Location {
  id: string;
  name: string;
  description?: string;
  floor?: string | number;
  coordinates?: {
    x: number;
    y: number;
  };
  category?: string;
}

export interface StoreMapProps {
  locations: Location[];
  title?: string;
  description?: string;
  highlightedLocationId?: string;
  floorplan?: string; // URL zum Floorplan-Bild
  primaryColor?: string;
  secondaryColor?: string;
}

const StoreMap: React.FC<StoreMapProps> = ({
  locations,
  title = 'Geschäfte & Einrichtungen',
  description,
  highlightedLocationId,
  floorplan,
  primaryColor = '#4f46e5',
  secondaryColor = '#ffffff',
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = primaryColor || useColorModeValue('blue.500', 'blue.300');
  
  // Sortiere Locations nach Etagen (falls verfügbar)
  const sortedLocations = [...locations].sort((a, b) => {
    // Wenn keine Etagen definiert sind, behalte die ursprüngliche Reihenfolge
    if (!a.floor && !b.floor) return 0;
    // Wenn nur eine Etage hat, sortiere die mit Etage zuerst
    if (!a.floor) return 1;
    if (!b.floor) return -1;
    
    // Konvertiere Etagen zu Zahlen für die Sortierung
    const floorA = typeof a.floor === 'string' ? parseInt(a.floor, 10) || 0 : a.floor;
    const floorB = typeof b.floor === 'string' ? parseInt(b.floor, 10) || 0 : b.floor;
    
    return floorA - floorB;
  });
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      p={4}
      shadow="sm"
      width="100%"
      my={4}
    >
      <Heading as="h3" size="md" mb={2} style={{ color: accentColor }}>
        {title}
      </Heading>
      
      {description && (
        <Text fontSize="sm" mb={4} color="gray.600">
          {description}
        </Text>
      )}
      
      {floorplan && (
        <Box mb={4} position="relative" borderRadius="md" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
          <img 
            src={floorplan} 
            alt="Floorplan" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: '300px', 
              objectFit: 'contain' 
            }} 
          />
          
          {/* Markiere Standorte auf dem Floorplan */}
          {locations.filter(loc => loc.coordinates).map(location => (
            <Box
              key={location.id}
              position="absolute"
              left={`${location.coordinates?.x}%`}
              top={`${location.coordinates?.y}%`}
              transform="translate(-50%, -50%)"
              width="12px"
              height="12px"
              borderRadius="full"
              bg={location.id === highlightedLocationId ? 'red.500' : accentColor}
              border="2px solid white"
              boxShadow="0 0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.2)"
              zIndex="1"
              title={location.name}
              cursor="pointer"
              _hover={{
                boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.3)",
                transform: "translate(-50%, -50%) scale(1.2)"
              }}
              transition="all 0.2s"
            />
          ))}
        </Box>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        {sortedLocations.map(location => (
          <Box 
            key={location.id}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            borderColor={location.id === highlightedLocationId ? accentColor : borderColor}
            bg={location.id === highlightedLocationId ? `${accentColor}10` : 'transparent'}
          >
            <Heading as="h4" size="sm" mb={1}>
              {location.name}
            </Heading>
            
            {location.floor && (
              <Text fontSize="xs" color="gray.500" mb={1}>
                Etage: {typeof location.floor === 'string' ? location.floor : location.floor + '. Etage'}
              </Text>
            )}
            
            {location.category && (
              <Text fontSize="xs" color="gray.500" mb={1}>
                {location.category}
              </Text>
            )}
            
            {location.description && (
              <Text fontSize="sm" mt={2} color="gray.600">
                {location.description}
              </Text>
            )}
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default StoreMap; 