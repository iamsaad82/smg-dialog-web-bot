import React from 'react';
import { InteractiveElement } from '../../types/interactive';
import { Box, Button, Stack, Text, SimpleGrid } from '@chakra-ui/react';
import OpeningHoursTable from '../ui-components/OpeningHoursTable';
import StoreMap from '../ui-components/StoreMap';
import ProductShowcase from '../ui-components/ProductShowcase';
import ContactCard from '../ui-components/ContactCard';

interface InteractiveElementRendererProps {
  elements: InteractiveElement[];
  primaryColor?: string;
}

const InteractiveElementRenderer: React.FC<InteractiveElementRendererProps> = ({ 
  elements,
  primaryColor = '#4f46e5'
}) => {
  const handleClick = (element: InteractiveElement) => {
    if (element.type === 'link' && 'url' in element) {
      window.open(element.url, '_blank');
    }
  };

  if (!elements || elements.length === 0) return null;

  return (
    <Box mt={4}>
      <SimpleGrid columns={{ base: 1, sm: Math.min(elements.length, 3) }} spacing={2}>
        {elements.map((element, index) => {
          switch (element.type) {
            case 'button':
              return (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  colorScheme="brand"
                  onClick={() => handleClick(element)}
                >
                  {element.label}
                </Button>
              );
            
            case 'link':
              return (
                <Button
                  key={index}
                  as="a"
                  href={element.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  variant="outline"
                  colorScheme="brand"
                >
                  {element.label}
                </Button>
              );
            
            case 'info':
              return (
                <Box
                  key={index}
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  borderLeft="4px"
                  borderColor={primaryColor}
                >
                  <Text fontSize="sm">{element.content}</Text>
                </Box>
              );
              
            case 'opening_hours_table':
              return (
                <OpeningHoursTable
                  key={index}
                  data={element.data}
                  title={element.title}
                  description={element.label}
                />
              );
              
            case 'store_map':
              return (
                <StoreMap
                  key={index}
                  locations={element.locations}
                  title={element.title}
                  description={element.label}
                  highlightedLocationId={element.highlightedLocationId}
                  floorplan={element.floorplan}
                />
              );
              
            case 'product_showcase':
              return (
                <ProductShowcase
                  key={index}
                  products={element.products}
                  title={element.title}
                  description={element.label}
                  layout={element.layout}
                  showDetailsButton={element.showDetailsButton}
                />
              );
              
            case 'contact_card':
              return (
                <ContactCard
                  key={index}
                  contacts={element.contacts}
                  title={element.title}
                  description={element.label}
                  layout={element.layout}
                  showActions={element.showActions}
                />
              );
            
            default:
              return null;
          }
        })}
      </SimpleGrid>
    </Box>
  );
};

export default InteractiveElementRenderer; 