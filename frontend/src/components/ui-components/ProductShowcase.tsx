import React from 'react';
import { Box, Heading, Text, Image, SimpleGrid, Badge, Button, Flex, useColorModeValue } from '@chakra-ui/react';
import { CardSlider } from '@/components/ui/card-slider';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  discountPrice?: string;
  categories?: string[];
  shopName?: string;
  floor?: string | number;
  availability?: 'in-stock' | 'limited' | 'out-of-stock';
  url?: string;
}

export interface ProductShowcaseProps {
  products: Product[];
  title?: string;
  description?: string;
  layout?: 'grid' | 'list';
  showDetailsButton?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  products,
  title = 'Produkte & Angebote',
  description,
  layout = 'grid',
  showDetailsButton = true,
  primaryColor = '#4f46e5',
  secondaryColor = '#ffffff',
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = primaryColor || useColorModeValue('blue.500', 'blue.300');
  const discountColor = useColorModeValue('red.500', 'red.300');

  // Produktkarten erstellen
  const productCards = products.map((product) => (
    <Box
      key={product.id}
      borderWidth="1px"
      borderRadius="md"
      overflow="hidden"
      borderColor={borderColor}
      height="100%"
      display="flex"
      flexDirection="column"
      width="100%"
    >
      {product.imageUrl && (
        <Box
          height={{ base: "120px", sm: "140px" }}
          bgImage={`url(${product.imageUrl})`}
          bgSize="cover"
          bgPosition="center"
        />
      )}
      
      <Box p={3} flex="1" display="flex" flexDirection="column">
        <Flex justify="space-between" align="flex-start">
          <Box flex="1" mr={2}>
            <Heading as="h4" size="sm" mb={1} noOfLines={1}>
              {product.name}
            </Heading>
            
            {product.shopName && (
              <Text fontSize="xs" color="gray.500" mb={1} noOfLines={1}>
                {product.shopName} {product.floor ? `• ${typeof product.floor === 'string' ? product.floor : product.floor + '. Etage'}` : ''}
              </Text>
            )}
          </Box>
          
          {product.price && (
            <Box textAlign="right" flexShrink={0}>
              {product.discountPrice ? (
                <>
                  <Text as="s" fontSize="xs" color="gray.500">
                    {product.price}
                  </Text>
                  <Text fontWeight="bold" color={discountColor}>
                    {product.discountPrice}
                  </Text>
                </>
              ) : (
                <Text fontWeight="bold">
                  {product.price}
                </Text>
              )}
            </Box>
          )}
        </Flex>
        
        {product.description && (
          <Text fontSize="sm" mt={2} color="gray.600" noOfLines={2}>
            {product.description}
          </Text>
        )}
        
        <Flex mt={3} justifyContent="space-between" alignItems="center" marginTop="auto">
          <Flex wrap="wrap" gap={1} flex="1">
            {product.categories?.slice(0, 2).map((category, idx) => (
              <Badge 
                key={idx} 
                colorScheme="blue" 
                variant="subtle" 
                fontSize="xs"
                style={{ 
                  backgroundColor: `${primaryColor}20`,
                  color: accentColor 
                }}
              >
                {category}
              </Badge>
            ))}
            
            {product.availability && (
              <Badge 
                colorScheme={
                  product.availability === 'in-stock' ? 'green' : 
                  product.availability === 'limited' ? 'orange' : 'red'
                }
                variant="subtle"
                fontSize="xs"
              >
                {product.availability === 'in-stock' ? 'Verfügbar' : 
                 product.availability === 'limited' ? 'Begrenzt' : 'Nicht verfügbar'}
              </Badge>
            )}
          </Flex>
          
          {showDetailsButton && product.url && (
            <Button 
              size="xs" 
              colorScheme="blue" 
              variant="outline"
              as="a"
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: accentColor, borderColor: accentColor }}
              flexShrink={0}
            >
              Details
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  ));

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      p={{ base: 3, sm: 4 }}
      shadow="sm"
      width="100%"
      my={3}
    >
      {/* Verwende den CardSlider für mehrere Produkte, SimpleGrid für einzelne Produkte */}
      {products.length <= 1 ? (
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
            {productCards}
          </SimpleGrid>
        </>
      ) : (
        <CardSlider 
          title={title}
          itemsPerView={layout === 'grid' ? 2 : 1}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        >
          {productCards}
        </CardSlider>
      )}
    </Box>
  );
};

export default ProductShowcase; 