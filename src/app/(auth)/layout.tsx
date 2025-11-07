// src/app/(auth)/layout.tsx
import { PackageSearch } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary-light relative overflow-hidden">
        {/* Grid pattern de fondo */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="animate-slide-in">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <PackageSearch size={48} />
              </div>
              <div>
                <h1 className="text-4xl font-bold">InventoryPro</h1>
                <p className="text-primary-light text-sm">
                  Sistema de Gestión Inteligente
                </p>
              </div>
            </div>

            <div className="space-y-6 max-w-md">
              <div className="flex items-start gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                <div className="p-2 bg-white/20 rounded-lg mt-1 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Control Total</h3>
                  <p className="text-primary-light/90 text-sm">
                    Gestiona vehículos y refacciones con trazabilidad completa
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                <div className="p-2 bg-white/20 rounded-lg mt-1 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Reportes Automáticos</h3>
                  <p className="text-primary-light/90 text-sm">
                    Genera acuses y reportes en PDF/Excel al instante
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                <div className="p-2 bg-white/20 rounded-lg mt-1 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Seguridad Avanzada</h3>
                  <p className="text-primary-light/90 text-sm">
                    Auditoría completa y permisos granulares por usuario
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-sm text-primary-light/90 italic">
                "Desde que implementamos InventoryPro, redujimos errores de inventario en un 85% y optimizamos nuestros tiempos de registro."
              </p>
              <p className="text-sm font-semibold mt-3">
                — Director de Operaciones, AutoPartes MX
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}