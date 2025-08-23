import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Helmet } from "react-helmet";

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalBilling: number;
  pendingBilling: number;
  paidBilling: number;
}

interface RecentAppointment {
  id: string;
  patientName: string;
  dateTime: string;
  type: string;
  status: string;
}

interface RecentBilling {
  id: string;
  patientName: string;
  amount: number;
  status: string;
  dueDate: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    newPatientsThisMonth: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalBilling: 0,
    pendingBilling: 0,
    paidBilling: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [recentBilling, setRecentBilling] = useState<RecentBilling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const accessToken = localStorage.getItem('accessToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      if (!backendUrl || !accessToken || !userData.id) {
        throw new Error('Missing configuration');
      }

      // Fetch dashboard data
      const [patientsResponse, appointmentsResponse, billingResponse] = await Promise.all([
        fetch(`${backendUrl}/api/doctors/${userData.id}/patients?page=1&limit=1`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${backendUrl}/api/doctors/${userData.id}/appointments?page=1&limit=5`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${backendUrl}/api/doctors/${userData.id}/billing?page=1&limit=5`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      // Process responses and update state
      // This is a simplified version - in real implementation you'd process the actual API responses
      setStats({
        totalPatients: 45,
        activePatients: 42,
        newPatientsThisMonth: 8,
        totalAppointments: 156,
        pendingAppointments: 12,
        completedAppointments: 144,
        totalBilling: 8500000,
        pendingBilling: 1200000,
        paidBilling: 7300000
      });

      setRecentAppointments([
        {
          id: '1',
          patientName: 'María González',
          dateTime: '2024-01-15T10:00:00',
          type: 'Presencial',
          status: 'confirmed'
        },
        {
          id: '2',
          patientName: 'Carlos Rodríguez',
          dateTime: '2024-01-15T11:00:00',
          type: 'Remota',
          status: 'scheduled'
        },
        {
          id: '3',
          patientName: 'Ana Silva',
          dateTime: '2024-01-15T14:00:00',
          type: 'Presencial',
          status: 'completed'
        }
      ]);

      setRecentBilling([
        {
          id: '1',
          patientName: 'María González',
          amount: 50000,
          status: 'pending',
          dueDate: '2024-01-20'
        },
        {
          id: '2',
          patientName: 'Carlos Rodríguez',
          amount: 40000,
          status: 'paid',
          dueDate: '2024-01-18'
        },
        {
          id: '3',
          patientName: 'Ana Silva',
          amount: 50000,
          status: 'overdue',
          dueDate: '2024-01-15'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Programada</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBillingStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | Tiare - Gestión de Práctica Médica</title>
        <meta name="description" content="Panel principal de gestión de tu práctica médica" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Bienvenido de vuelta, Dr. Pérez</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Ver agenda
              </Button>
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Nuevo paciente
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.newPatientsThisMonth} este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  de {stats.totalAppointments} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facturación Pendiente</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.pendingBilling)}</div>
                <p className="text-xs text-muted-foreground">
                  de {formatCurrency(stats.totalBilling)} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Completación</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((stats.completedAppointments / stats.totalAppointments) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Citas completadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Próximas Citas
                </CardTitle>
                <CardDescription>
                  Tus próximas consultas programadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{appointment.patientName}</p>
                          <p className="text-xs text-gray-500">{formatDate(appointment.dateTime)}</p>
                          <p className="text-xs text-gray-500">{appointment.type}</p>
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Ver todas las citas
                </Button>
              </CardContent>
            </Card>

            {/* Recent Billing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Facturación Reciente
                </CardTitle>
                <CardDescription>
                  Estado de tus facturas y pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBilling.map((billing) => (
                    <div key={billing.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{billing.patientName}</p>
                          <p className="text-xs text-gray-500">Vence: {billing.dueDate}</p>
                          <p className="text-sm font-semibold">{formatCurrency(billing.amount)}</p>
                        </div>
                      </div>
                      {getBillingStatusBadge(billing.status)}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Ver todas las facturas
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Accede rápidamente a las funciones más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  <span className="text-sm">Nuevo Paciente</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Calendar className="w-6 h-6 mb-2" />
                  <span className="text-sm">Nueva Cita</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <DollarSign className="w-6 h-6 mb-2" />
                  <span className="text-sm">Nueva Factura</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Clock className="w-6 h-6 mb-2" />
                  <span className="text-sm">Ver Agenda</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
