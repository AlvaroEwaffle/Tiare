import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, DollarSign, Settings, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet";

interface WorkingHours {
  [key: string]: { start: string; end: string; available: boolean };
}

interface ConsultationType {
  type: 'presential' | 'remote' | 'home';
  price: number;
  duration: number;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workingHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: false },
      sunday: { start: '09:00', end: '13:00', available: false }
    } as WorkingHours,
    consultationTypes: [
      { type: 'presential' as const, price: 50000, duration: 60 },
      { type: 'remote' as const, price: 40000, duration: 60 },
      { type: 'home' as const, price: 80000, duration: 60 }
    ] as ConsultationType[],
    appointmentDuration: 60,
    maxAppointmentsPerDay: 8,
    billingCycle: 'daily' as 'daily' | 'weekly' | 'monthly',
    automaticReminders: true,
    reminder24hBefore: true,
    reminder2hBefore: true,
    reminderAfterAppointment: true,
    paymentMethods: ['transfer', 'cash'],
    defaultCurrency: 'CLP',
    taxPercentage: 0
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const handleWorkingHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleConsultationTypeChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      consultationTypes: prev.consultationTypes.map((type, i) => 
        i === index ? { ...type, [field]: value } : type
      )
    }));
  };

  const addConsultationType = () => {
    setFormData(prev => ({
      ...prev,
      consultationTypes: [...prev.consultationTypes, { type: 'presential', price: 50000, duration: 60 }]
    }));
  };

  const removeConsultationType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      consultationTypes: prev.consultationTypes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) throw new Error('Backend URL not configured');

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`${backendUrl}/api/doctors/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          practiceSettings: {
            workingHours: formData.workingHours,
            consultationTypes: formData.consultationTypes,
            appointmentDuration: formData.appointmentDuration,
            maxAppointmentsPerDay: formData.maxAppointmentsPerDay
          },
          billingPreferences: {
            billingCycle: formData.billingCycle,
            automaticReminders: formData.automaticReminders,
            reminder24hBefore: formData.reminder24hBefore,
            reminder2hBefore: formData.reminder2hBefore,
            reminderAfterAppointment: formData.reminderAfterAppointment,
            paymentMethods: formData.paymentMethods,
            defaultCurrency: formData.defaultCurrency,
            taxPercentage: formData.taxPercentage
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update practice settings');
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating practice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold">Configura tus horarios de trabajo</h3>
              <p className="text-gray-600">Define cuándo estás disponible para atender pacientes</p>
            </div>

            <div className="space-y-4">
              {daysOfWeek.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.workingHours[key].available}
                      onCheckedChange={(checked) => handleWorkingHoursChange(key, 'available', checked)}
                    />
                    <Label className="w-20 font-medium">{label}</Label>
                  </div>
                  
                  {formData.workingHours[key].available && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={formData.workingHours[key].start}
                        onChange={(e) => handleWorkingHoursChange(key, 'start', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">a</span>
                      <Input
                        type="time"
                        value={formData.workingHours[key].end}
                        onChange={(e) => handleWorkingHoursChange(key, 'end', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold">Tipos de consulta y precios</h3>
              <p className="text-gray-600">Define los diferentes tipos de atención que ofreces</p>
            </div>

            <div className="space-y-4">
              {formData.consultationTypes.map((type, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Tipo de consulta {index + 1}</h4>
                    {formData.consultationTypes.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeConsultationType(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={type.type}
                        onValueChange={(value) => handleConsultationTypeChange(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presential">Presencial</SelectItem>
                          <SelectItem value="remote">Remota</SelectItem>
                          <SelectItem value="home">A domicilio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Precio (CLP)</Label>
                      <Input
                        type="number"
                        value={type.price}
                        onChange={(e) => handleConsultationTypeChange(index, 'price', parseInt(e.target.value))}
                        placeholder="50000"
                      />
                    </div>
                    
                    <div>
                      <Label>Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={type.duration}
                        onChange={(e) => handleConsultationTypeChange(index, 'duration', parseInt(e.target.value))}
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addConsultationType}
                className="w-full"
              >
                + Agregar tipo de consulta
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold">Configuración de agenda</h3>
              <p className="text-gray-600">Ajusta los parámetros de tu agenda</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Duración por defecto de citas (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.appointmentDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentDuration: parseInt(e.target.value) }))}
                    placeholder="60"
                  />
                </div>
                
                <div>
                  <Label>Máximo de citas por día</Label>
                  <Input
                    type="number"
                    value={formData.maxAppointmentsPerDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAppointmentsPerDay: parseInt(e.target.value) }))}
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Ciclo de facturación</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, billingCycle: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Moneda por defecto</Label>
                  <Select
                    value={formData.defaultCurrency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, defaultCurrency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold">Recordatorios y notificaciones</h3>
              <p className="text-gray-600">Configura cómo quieres que se comunique con tus pacientes</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Recordatorios automáticos</Label>
                  <p className="text-sm text-gray-600">Enviar recordatorios de citas automáticamente</p>
                </div>
                <Switch
                  checked={formData.automaticReminders}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, automaticReminders: checked }))}
                />
              </div>

              {formData.automaticReminders && (
                <div className="space-y-3 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>24 horas antes de la cita</Label>
                    <Switch
                      checked={formData.reminder24hBefore}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder24hBefore: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>2 horas antes de la cita</Label>
                    <Switch
                      checked={formData.reminder2hBefore}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder2hBefore: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Después de la consulta</Label>
                    <Switch
                      checked={formData.reminderAfterAppointment}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminderAfterAppointment: checked }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-medium text-green-800">¡Configuración completa!</h4>
              <p className="text-sm text-green-600">Tu práctica está lista para recibir pacientes</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Configuración inicial | Tiare - Gestión de Práctica Médica</title>
        <meta name="description" content="Configura tu práctica médica en Tiare" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Paso {currentStep} de 4</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / 4) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">Configuración de tu práctica</CardTitle>
              <CardDescription className="text-center">
                Personaliza Tiare según tus necesidades
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Anterior
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={nextStep}>
                    Siguiente
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </div>
                    ) : (
                      'Finalizar configuración'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
