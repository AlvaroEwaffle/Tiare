
import { XCircle, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Error = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4 animate-scale-in">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Error en el pago
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Hubo un problema al procesar tu pago. No te preocupes, 
          no se realizó ningún cargo a tu cuenta.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/preview')}
            size="lg"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Intentar nuevamente
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
          </Button>
        </div>
        
        <div className="flex items-center justify-center space-x-2 text-gray-500 mt-8">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">ComoUsarChatGPT.cl</span>
        </div>
      </div>
    </div>
  );
};

export default Error;
