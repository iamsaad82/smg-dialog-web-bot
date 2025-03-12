import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Avatar, 
  Stack, 
  Icon, 
  Badge, 
  Divider,
  Grid,
  SimpleGrid,
  useColorModeValue,
  Heading
} from '@chakra-ui/react';
import { PhoneIcon, EmailIcon, LinkIcon, TimeIcon, InfoIcon, StarIcon } from '@chakra-ui/icons';
import { CardSlider } from '@/components/ui/card-slider';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaGlobe } from 'react-icons/fa';

export interface ContactInfo {
  id: string;
  name: string;
  title?: string;
  imageUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
  tags?: string[];
  links?: {
    type: 'website' | 'appointment' | 'map' | 'email' | 'phone';
    label: string;
    url: string;
  }[];
  social?: {
    platform: string;
    url: string;
  }[];
  rating?: {
    score: number;
    max: number;
    reviews?: number;
  };
}

export interface ContactCardProps {
  contacts: ContactInfo[];
  title?: string;
  description?: string;
  layout?: 'grid' | 'list';
  showActions?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contacts,
  title = 'Kontakte',
  description,
  layout = 'grid',
  showActions = true,
  primaryColor = '#4f46e5',
  secondaryColor = '#ffffff',
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = primaryColor || useColorModeValue('blue.500', 'blue.300');
  const badgeBgColor = useColorModeValue('gray.100', 'gray.700');

  const renderRating = (rating: { score: number; max: number; reviews?: number }) => {
    const fullStars = Math.floor(rating.score);
    const hasHalfStar = rating.score % 1 >= 0.5;
    const emptyStars = Math.floor(rating.max - rating.score - (hasHalfStar ? 0.5 : 0));

    return (
      <Flex align="center">
        <Flex>
          {Array.from({ length: fullStars }).map((_, i) => (
            <Icon key={`full-${i}`} as={StarIcon} color="yellow.400" />
          ))}
          {hasHalfStar && (
            <Icon key="half" as={StarIcon} color="yellow.400" opacity={0.5} />
          )}
          {Array.from({ length: emptyStars }).map((_, i) => (
            <Icon key={`empty-${i}`} as={StarIcon} color="gray.300" />
          ))}
        </Flex>
        {rating.reviews && (
          <Text ml={2} fontSize="sm" color="gray.500">
            ({rating.reviews} Bewertungen)
          </Text>
        )}
      </Flex>
    );
  };

  // Erstellen der Kontaktkarten als einzelne Komponenten
  const contactCards = contacts.map((contact, index) => (
    <Box
      key={contact.id || index}
      borderWidth="1px"
      borderRadius="md"
      overflow="hidden"
      borderColor={borderColor}
      height="100%"
      display="flex"
      flexDirection="column"
    >
      <Flex p={4} align="center" borderBottomWidth={contact.description ? "1px" : "0px"} borderColor={borderColor}>
        <Avatar
          size="lg"
          name={contact.name}
          src={contact.imageUrl}
          bg={accentColor}
        />
        <Box ml={4}>
          <Text fontWeight="bold" fontSize="lg">
            {contact.name}
          </Text>
          {contact.title && (
            <Text color="gray.600" fontSize="sm">
              {contact.title}
            </Text>
          )}

          {contact.tags && contact.tags.length > 0 && (
            <Flex mt={1} flexWrap="wrap" gap={1}>
              {contact.tags.map((tag, idx) => (
                <Badge key={idx} bg={badgeBgColor} fontSize="xs">
                  {tag}
                </Badge>
              ))}
            </Flex>
          )}

          {contact.rating && (
            <Box mt={1}>
              {renderRating(contact.rating)}
            </Box>
          )}
        </Box>
      </Flex>

      {contact.description && (
        <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
          <Text fontSize="sm" color="gray.600">
            {contact.description}
          </Text>
        </Box>
      )}

      <Stack spacing={0} divider={<Divider />} flex="1">
        {contact.address && (
          <Flex p={3} alignItems="center">
            <Icon as={InfoIcon} color="gray.500" mr={3} />
            <Text fontSize="sm">{contact.address}</Text>
          </Flex>
        )}

        {contact.hours && (
          <Flex p={3} alignItems="center">
            <Icon as={TimeIcon} color="gray.500" mr={3} />
            <Text fontSize="sm">{contact.hours}</Text>
          </Flex>
        )}
      </Stack>

      {showActions && (
        <Flex p={3} justifyContent="space-between" flexWrap="wrap" gap={2} mt="auto">
          {contact.phone && (
            <Button
              as="a"
              href={`tel:${contact.phone}`}
              size="sm"
              leftIcon={<PhoneIcon />}
              colorScheme="blue"
              variant="outline"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              Anrufen
            </Button>
          )}

          {contact.email && (
            <Button
              as="a"
              href={`mailto:${contact.email}`}
              size="sm"
              leftIcon={<EmailIcon />}
              colorScheme="blue"
              variant="outline"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              E-Mail
            </Button>
          )}

          {contact.website && (
            <Button
              as="a"
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              leftIcon={<LinkIcon />}
              colorScheme="blue"
              variant="outline"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              Website
            </Button>
          )}

          {contact.links && contact.links.length > 0 && 
            contact.links.map((link, idx) => (
              <Button
                key={idx}
                as="a"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                leftIcon={<LinkIcon />}
                colorScheme="blue"
                variant="outline"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {link.label}
              </Button>
            ))
          }
        </Flex>
      )}
    </Box>
  ));

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
      {/* Verwende den CardSlider für mehrere Kontakte, SimpleGrid für nur einen Kontakt */}
      {contacts.length <= 1 ? (
        <>
          <Heading as="h3" size="md" mb={2} style={{ color: accentColor }}>
            {title}
          </Heading>
          
          {description && (
            <Text fontSize="sm" mb={4} color="gray.600">
              {description}
            </Text>
          )}
          
          <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
            {contactCards}
          </SimpleGrid>
        </>
      ) : (
        <CardSlider 
          title={title}
          itemsPerView={layout === 'grid' ? 2 : 1}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        >
          {contactCards}
        </CardSlider>
      )}
    </Box>
  );
};

export default ContactCard; 