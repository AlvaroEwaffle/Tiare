import { ArrowRight, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const Index = () => {
    const navigate = useNavigate();

    return (
        <>
            <Helmet>
                <title>Ewaffle | Crea tu curso producto digital profesional con IA</title>
                <meta name="description" content="Diseña y lanza tu curso e-learning desde cero. Herramienta potenciada con IA para transformar tu conocimiento experto en una propuesta profesional, con estructura gratuita y premium." />
            </Helmet>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
                {/* Logo and Brand */}
                <div className="flex flex-col items-center">
                    <img src="/logoprimario.png" alt="Ewaffle Logo" className="w-80 object-contain mt-8" />
                </div>

                {/* Floating White Card */}
                <div className="w-full max-w-6xl bg-white bg-opacity-90 rounded-2xl shadow-xl flex flex-col items-center justify-center min-h-[50vh] p-8 md:p-12">
                    {/* Headline */}
                    <h1 className="text-center text-4xl md:text-6xl font-bold leading-tight mb-4 text-primary" >
                        Diseña desde cero <br />
                        <span className="bg-gradient-to-r from-secondary-500 via-accent-500 to-secondary-500 bg-clip-text text-transparent">tu producto digital</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-center text-lg md:text-2xl text-gray-500 max-w-3xl text-primary mb-8 mt-4">
                        Ponemos a tu disposición una herramienta potenciada con IA para que puedas crear tu curso o ebook de forma sencilla y con resultados excepcionales.
                    </p>

                    {/* Feature Badges */}
                    <div className="flex flex-row items-center justify-center gap-4 mb-8">
                        <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-50 text-secondary-700 text-base font-medium">
                            <Target className="w-5 h-5 text-secondary-400" /> Propuesta básica gratis
                        </span>
                        <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 text-accent-700 text-base font-medium">
                            <Zap className="w-5 h-5 text-accent-400" /> Estructura completa premium
                        </span>
                        <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-base font-medium">
                            <Zap className="w-5 h-5 text-primary-400" /> Producción multimedia por Ewaffle
                        </span>
                    </div>

                    {/* CTA Button */}
                    <Button
                        onClick={() => navigate('/form')}
                        size="lg"
                        className="w-full max-w-xs py-5 text-lg font-bold rounded-xl shadow-xl bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-secondary-600 hover:to-primary-600 border-0 text-white flex items-center justify-center gap-2 animate-scale-in"
                    >
                        Comenzar mi diseño gratis <ArrowRight className="w-5 h-5" />
                    </Button>

                    {/* Subtext */}
                    <div className="mt-3 text-center text-sm text-primary-400">
                        <span className="inline-block align-middle">✨ Sin tarjeta de crédito requerida · Resultados en minutos</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Index; 