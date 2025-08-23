import { useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface MercadoPagoButtonProps {
  preferenceId: string;
  onError?: (error: any) => void;
  onReady?: () => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const MercadoPagoButton = ({ preferenceId, onError, onReady }: MercadoPagoButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = 'mercadopago-button-container';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!publicKey) {
      setError('Mercado Pago configuration is missing');
      setIsLoading(false);
      return;
    }

    // Load MercadoPago SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    script.onload = () => {
      try {
        const mp = new window.MercadoPago(publicKey);
        const bricksBuilder = mp.bricks();

        const renderWalletBrick = async () => {
          if (containerRef.current) {
            await bricksBuilder.create('wallet', containerId, {
              initialization: {
                preferenceId: preferenceId,
              },
              callbacks: {
                onError: (error: any) => {
                  console.error('Error:', error);
                  setError('Error al cargar el botón de pago');
                  onError?.(error);
                  toast({
                    title: "Error",
                    description: "Hubo un problema al cargar el botón de pago. Por favor, intenta nuevamente.",
                    variant: "destructive",
                  });
                },
                onReady: () => {
                  console.log('Wallet ready');
                  setIsLoading(false);
                  onReady?.();
                },
              },
            });
          }
        };

        renderWalletBrick();
      } catch (error) {
        console.error('Error initializing Mercado Pago:', error);
        setError('Error al inicializar Mercado Pago');
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError('Error al cargar el SDK de Mercado Pago');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      document.body.removeChild(script);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [preferenceId, onError, onReady]);

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      id={containerId}
      className="w-full"
    />
  );
};

export default MercadoPagoButton; 