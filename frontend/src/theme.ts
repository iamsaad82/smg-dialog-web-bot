import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Chakra UI Theme Konfiguration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Einheitliche Schatten
const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

// Einheitliche Abstände
const space = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

// Einheitliche Radien
const radii = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
};

// Basis-Theme-Definition
const theme = extendTheme({
  config,
  colors: {
    gray: {
      50: '#FAFAFA',   // Hellster Hintergrund
      100: '#F4F4F5',  // Alternativer Hintergrund
      200: '#E4E4E7',  // Borders, Divider
      300: '#D4D4D8',  // Disabled Zustände
      400: '#A1A1AA',  // Placeholder Text
      500: '#71717A',  // Sekundärer Text
      600: '#52525B',  // Primärer Text
      700: '#3F3F46',  // Überschriften
      800: '#27272A',  // Betonte Überschriften
      900: '#18181B',  // Extra betonte Elemente
    },
    brand: {
      50: '#F0F7FF',
      100: '#E0F0FF',
      200: '#BAE0FF',
      300: '#7CC5FF',
      400: '#36AEFF',
      500: '#0095FF',
      600: '#0077E6',
      700: '#005CB3',
      800: '#004280',
      900: '#002952',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
      },
    },
  },
  components: {
    // Container und Layout-Komponenten
    Container: {
      baseStyle: {
        maxW: 'container.xl',
        px: { base: 4, md: 6, lg: 8 },
      },
    },
    Box: {
      baseStyle: {
        bg: 'white',
        borderRadius: 'md',
        borderWidth: '1px',
        borderColor: 'gray.200',
        shadow: 'sm',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'md',
          borderWidth: '1px',
          borderColor: 'gray.200',
          shadow: 'sm',
          p: 'md',
        },
      },
    },

    // Text und Typografie
    Heading: {
      baseStyle: {
        color: 'gray.800',
        fontWeight: 'semibold',
      },
      sizes: {
        xl: { fontSize: '2.25rem', lineHeight: '2.5rem' },
        lg: { fontSize: '1.875rem', lineHeight: '2.25rem' },
        md: { fontSize: '1.5rem', lineHeight: '2rem' },
        sm: { fontSize: '1.25rem', lineHeight: '1.75rem' },
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.600',
      },
    },

    // Interaktive Elemente
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
          _active: {
            bg: 'brand.700',
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
          },
        },
        ghost: {
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
        size: 'md',
        colorScheme: 'brand',
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'white',
            borderColor: 'gray.200',
            _hover: {
              borderColor: 'gray.300',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },

    // Navigation und Menüs
    Menu: {
      baseStyle: {
        list: {
          bg: 'white',
          borderWidth: '1px',
          borderColor: 'gray.200',
          shadow: 'lg',
          borderRadius: 'md',
          p: 'sm',
        },
        item: {
          color: 'gray.700',
          _hover: {
            bg: 'gray.50',
          },
          _focus: {
            bg: 'gray.50',
          },
        },
      },
    },

    // Feedback und Status
    Alert: {
      variants: {
        subtle: (props: { status: string }) => {
          const statusColors: Record<string, { bg: string; color: string }> = {
            info: { bg: 'brand.50', color: 'brand.700' },
            success: { bg: '#F0FDF4', color: '#166534' },
            warning: { bg: '#FFFBEB', color: '#92400E' },
            error: { bg: '#FEF2F2', color: '#991B1B' },
          };
          return {
            container: statusColors[props.status] || statusColors.info,
          };
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: '2',
        py: '0.5',
      },
      variants: {
        subtle: {
          bg: 'brand.100',
          color: 'brand.700',
        },
      },
    },

    // Tabellen
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'gray.200',
            color: 'gray.600',
            fontWeight: 'medium',
          },
          td: {
            borderColor: 'gray.200',
          },
        },
      },
    },
  },
  shadows,
  space,
  radii,
});

export default theme; 