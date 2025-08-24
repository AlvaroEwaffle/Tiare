import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UserPlus, MessageSquare, Copy, Check } from "lucide-react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";

const CreatePatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [createdPatient, setCreatedPatient] = useState<any>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Campos requeridos",
        description: "El nombre y teléfono son obligatorios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/patients/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setCreatedPatient(result);
      
      toast({
        title: "¡Paciente creado exitosamente!",
        description: `${result.patient.name} ha sido agregado al sistema`,
      });

    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        title: "Error al crear paciente",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (createdPatient?.whatsappLink) {
      try {
        await navigator.clipboard.writeText(createdPatient.whatsappLink);
        setLinkCopied(true);
        toast({
          title: "¡Enlace copiado!",
          description: "El enlace de WhatsApp ha sido copiado al portapapeles",
        });
        
        // Reset the copied state after 3 seconds
        setTimeout(() => setLinkCopied(false), 3000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Error al copiar",
          description: "No se pudo copiar el enlace al portapapeles",
          variant: "destructive"
        });
      }
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (createdPatient) {
    return (
      <>
        <Helmet>
          <title>Paciente Creado | Tiare - Gestión de Práctica Médica</title>
          <meta name="description" content="Paciente creado exitosamente" />
        </Helmet>
        
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>

            {/* Success Card */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-800">¡Paciente Creado Exitosamente!</CardTitle>
                <CardDescription className="text-green-600">
                  {createdPatient.patient.name} ha sido agregado al sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patient Info */}
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Paciente</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre:</span>
                      <p className="font-medium">{createdPatient.patient.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Teléfono:</span>
                      <p className="font-medium">{createdPatient.patient.phone}</p>
                    </div>
                    {createdPatient.patient.email && (
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium">{createdPatient.patient.email}</p>
                      </div>
                    )}
                    {createdPatient.patient.notes && (
                      <div>
                        <span className="text-gray-500">Notas:</span>
                        <p className="font-medium">{createdPatient.patient.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp Integration */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Iniciar Conversación por WhatsApp
                  </h3>
                  <p className="text-blue-700 text-sm mb-3">
                    {createdPatient.whatsappMessage}
                  </p>
                  <Button 
                    onClick={handleCopyLink}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={linkCopied}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        ¡Enlace Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Enlace
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-blue-600 text-center mt-2">
                    Copia este enlace y compártelo con el paciente para iniciar la conversación por WhatsApp
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={handleBackToDashboard}
                    className="flex-1"
                  >
                    Volver al Dashboard
                  </Button>
                  <Button 
                    onClick={() => {
                      setCreatedPatient(null);
                      setFormData({ name: "", email: "", phone: "", notes: "" });
                    }}
                    className="flex-1"
                  >
                    Crear Otro Paciente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Nuevo Paciente | Tiare - Gestión de Práctica Médica</title>
        <meta name="description" content="Agregar nuevo paciente al sistema" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nuevo Paciente</h1>
              <p className="text-gray-600">Agrega un nuevo paciente al sistema</p>
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Información del Paciente
              </CardTitle>
              <CardDescription>
                Completa los campos para registrar al nuevo paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ingresa el nombre completo"
                    required
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+34 612 345 678"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="paciente@ejemplo.com"
                  />
                </div>

                {/* Notes Field */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas adicionales</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Información adicional sobre el paciente..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando paciente...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Crear Paciente
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CreatePatient;
