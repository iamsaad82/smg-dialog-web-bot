import React from 'react';
import '../styles/globals.css';
import type { AppProps as NextAppProps } from 'next/app';
import Head from 'next/head';
// import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
// import theme from '../theme';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

// Früher wurde ein externes Toaster-Element verwendet, jetzt haben wir unsere eigene
// Toast-Lösung mit Sonner in @/utils/toast.ts und @/components/ui/toaster.tsx

type AppProps = NextAppProps & {
  pageProps: any;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AI Bot Dashboard</title>
        <meta name="description" content="Multi-Kunden KI-Bot-System mit Weaviate und moderner UI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <ColorModeScript initialColorMode={theme.config.initialColorMode} /> */}
      {/* <ChakraProvider theme={theme} resetCSS> */}
        <AuthProvider>
          <Component {...pageProps} />
          <Toaster />
        </AuthProvider>
      {/* </ChakraProvider> */}
    </>
  );
}