import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio | Reputación Online',
  description: 'Términos y condiciones de uso de la plataforma Reputación Online',
};

export default function TerminosDeServicio() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Términos de Servicio
          </h1>
          <p className="text-slate-600">
            Última actualización: {new Date().toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              1. Aceptación de los Términos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Al acceder y utilizar Reputación Online ("la Plataforma"), usted acepta estar sujeto a estos
              Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no debe
              utilizar nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              2. Descripción del Servicio
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Reputación Online es una plataforma de gestión y monitoreo de reputación digital que ofrece:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Monitoreo de menciones en redes sociales y medios digitales</li>
              <li>Análisis de sentimiento y tendencias</li>
              <li>Conexión con plataformas sociales (Facebook, X/Twitter, Instagram, YouTube, TikTok, LinkedIn, Threads)</li>
              <li>Reportes y estadísticas de reputación online</li>
              <li>Asistente AI especializado en gestión de reputación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              3. Registro y Cuenta de Usuario
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>3.1 Registro:</strong> Para utilizar la Plataforma, debe crear una cuenta proporcionando
                información precisa y completa.
              </p>
              <p className="leading-relaxed">
                <strong>3.2 Seguridad:</strong> Usted es responsable de mantener la confidencialidad de sus
                credenciales de acceso y de todas las actividades que ocurran bajo su cuenta.
              </p>
              <p className="leading-relaxed">
                <strong>3.3 Edad Mínima:</strong> Debe tener al menos 18 años para utilizar esta plataforma.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              4. Uso de Redes Sociales Conectadas
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>4.1 Autorización OAuth:</strong> Al conectar sus cuentas de redes sociales, nos autoriza
                a acceder a información específica según los permisos que otorgue.
              </p>
              <p className="leading-relaxed">
                <strong>4.2 Datos Recopilados:</strong> Recopilamos únicamente la información necesaria para
                proporcionar nuestros servicios de monitoreo y análisis de reputación.
              </p>
              <p className="leading-relaxed">
                <strong>4.3 TikTok:</strong> Al conectar su cuenta de TikTok, accedemos a información básica
                de usuario y lista de videos según los permisos otorgados (user.info.basic, video.list).
              </p>
              <p className="leading-relaxed">
                <strong>4.4 Revocación:</strong> Puede revocar el acceso a cualquier red social en cualquier
                momento desde la configuración de su cuenta.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              5. Planes y Pagos
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>5.1 Planes Disponibles:</strong> Ofrecemos diferentes planes (Básico, Profesional,
                Empresarial, Político) con diferentes niveles de acceso y funcionalidades.
              </p>
              <p className="leading-relaxed">
                <strong>5.2 Sistema de Créditos:</strong> Algunos planes utilizan un sistema de créditos para
                acceder a funcionalidades específicas.
              </p>
              <p className="leading-relaxed">
                <strong>5.3 Pagos:</strong> Los pagos se procesan de forma segura a través de Wompi.
                Al realizar un pago, acepta los términos y condiciones de nuestro procesador de pagos.
              </p>
              <p className="leading-relaxed">
                <strong>5.4 Reembolsos:</strong> Los reembolsos se manejan caso por caso según nuestra
                política de reembolsos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              6. Uso Aceptable
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Usted se compromete a NO:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Utilizar la Plataforma para fines ilegales o no autorizados</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Realizar ingeniería inversa o intentar obtener el código fuente</li>
              <li>Sobrecargar o interferir con el funcionamiento de la Plataforma</li>
              <li>Compartir su cuenta con terceros</li>
              <li>Publicar contenido ofensivo, difamatorio o que viole derechos de terceros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              7. Propiedad Intelectual
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo pero no limitado
              a software, diseño, contenido y marca, pertenecen a Reputación Online o sus licenciantes.
              No se otorga ninguna licencia o derecho más allá del uso personal y no comercial de la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              8. Limitación de Responsabilidad
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>8.1 Servicio "Como Está":</strong> La Plataforma se proporciona "como está" sin
                garantías de ningún tipo.
              </p>
              <p className="leading-relaxed">
                <strong>8.2 Disponibilidad:</strong> No garantizamos que la Plataforma estará disponible
                ininterrumpidamente o libre de errores.
              </p>
              <p className="leading-relaxed">
                <strong>8.3 Análisis AI:</strong> Los análisis y reportes generados por AI son orientativos
                y no constituyen asesoramiento profesional.
              </p>
              <p className="leading-relaxed">
                <strong>8.4 Datos de Terceros:</strong> No somos responsables de la precisión de los datos
                obtenidos de redes sociales o medios de comunicación externos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              9. Suspensión y Terminación
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Nos reservamos el derecho de suspender o terminar su cuenta si viola estos Términos de Servicio
              o por cualquier otra razón que consideremos apropiada. Usted puede cancelar su cuenta en
              cualquier momento desde la configuración de su perfil.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              10. Modificaciones
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento.
              Los cambios entrarán en vigor inmediatamente después de su publicación en la Plataforma.
              Su uso continuado constituye la aceptación de los términos modificados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              11. Ley Aplicable y Jurisdicción
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Estos Términos de Servicio se rigen por las leyes de la República de Colombia.
              Cualquier disputa será sometida a la jurisdicción exclusiva de los tribunales de Colombia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              12. Contacto
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Para preguntas sobre estos Términos de Servicio, puede contactarnos en:
            </p>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700">
                <strong>Email:</strong> soporte@reputaciononline.com.co
              </p>
              <p className="text-slate-700 mt-2">
                <strong>Sitio web:</strong>{' '}
                <a
                  href="https://reputaciononline.com.co"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://reputaciononline.com.co
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
