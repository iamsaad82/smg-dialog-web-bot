import React from 'react';
import { Box, Table, Tbody, Tr, Td, Heading, Text, useColorModeValue } from '@chakra-ui/react';

export interface OpeningHoursData {
  [key: string]: { open: string; close: string } | { closed: boolean };
}

export interface OpeningHoursTableProps {
  data: OpeningHoursData;
  title?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const OpeningHoursTable: React.FC<OpeningHoursTableProps> = ({
  data,
  title = 'Öffnungszeiten',
  description,
  primaryColor = '#4f46e5',
  secondaryColor = '#ffffff',
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = primaryColor || useColorModeValue('blue.500', 'blue.300');

  // Sortierfunktion für Wochentage
  const sortDays = (days: string[]): string[] => {
    const dayOrder = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    return days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  };

  const days = sortDays(Object.keys(data));

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
      
      <Table variant="simple" size="sm">
        <Tbody>
          {days.map((day) => {
            const hours = data[day];
            return (
              <Tr key={day}>
                <Td fontWeight="medium">{day}</Td>
                <Td textAlign="right">
                  {'closed' in hours ? (
                    <Text color="gray.500">Geschlossen</Text>
                  ) : (
                    <Text>
                      {hours.open} - {hours.close}
                    </Text>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};

export default OpeningHoursTable;