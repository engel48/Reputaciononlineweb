import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Reputación Online',
  description: 'Política de privacidad y protección de datos de Reputación Online',
};

export default function PoliticaDePrivacidad() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Política de Privacidad
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
              1. Introducción
            </h2>
            <p className="text-slate-700 leading-relaxed">
              En Reputación Online ("nosotros", "nuestro", "la Plataforma") nos tomamos muy en serio
              la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos,
              usamos, almacenamos y protegemos su información personal cuando utiliza nuestra plataforma
              de gestión de reputación digital.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              2. Información que Recopilamos
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">
                  2.1 Información de Registro
                </h3>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                  <li>Nombre completo</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Contraseña (encriptada)</li>
                  <li>Información de facturación (cuando aplique)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">
                  2.2 Información de Redes Sociales
                </h3>
                <p className="text-slate-700 leading-relaxed mb-2">
                  Cuando conecta sus cuentas de redes sociales mediante OAuth, recopilamos:
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                  <li><strong>Facebook:</strong> Perfil público, páginas administradas, publicaciones</li>
                  <li><strong>X/Twitter:</strong> Perfil, tweets, métricas de engagement</li>
                  <li><strong>Instagram:</strong> Perfil, publicaciones, estadísticas</li>
                  <li><strong>YouTube:</strong> Canal, videos, comentarios, métricas</li>
                  <li><strong>TikTok:</strong> Perfil (open_id, display_name, avatar), lista de videos, métricas públicas (seguidores, likes)</li>
                  <li><strong>LinkedIn:</strong> Perfil profesional, publicaciones</li>
                  <li><strong>Threads:</strong> Perfil, publicaciones</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">
                  2.3 Información de Uso
                </h3>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                  <li>Direcciones IP</li>
                  <li>Tipo de navegador y dispositivo</li>
                  <li>Páginas visitadas</li>
                  <li>Tiempo de uso de la plataforma</li>
                  <li>Interacciones con funcionalidades</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">
                  2.4 Cookies y Tecnologías Similares
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  Utilizamos cookies para mantener su sesión activa, recordar sus preferencias y
                  mejorar la experiencia del usuario. Puede configurar su navegador para rechazar
                  cookies, aunque esto puede limitar algunas funcionalidades.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              3. Cómo Usamos su Información
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Proporcionar y mantener nuestros servicios de monitoreo de reputación</li>
              <li>Analizar menciones y sentimiento en redes sociales y medios digitales</li>
              <li>Generar reportes personalizados de reputación online</li>
              <li>Procesar pagos y gestionar suscripciones</li>
              <li>Enviar notificaciones importantes sobre su cuenta</li>
              <li>Mejorar nuestros servicios y desarrollar nuevas funcionalidades</li>
              <li>Detectar y prevenir fraude o uso indebido</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              4. Almacenamiento y Seguridad de Datos
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>4.1 Encriptación:</strong> Todos los datos sensibles, incluyendo contraseñas y
                tokens de acceso OAuth, se almacenan utilizando encriptación AES-256-GCM.
              </p>
              <p className="leading-relaxed">
                <strong>4.2 Base de Datos:</strong> Utilizamos Supabase (PostgreSQL) con múltiples capas
                de seguridad y respaldos automáticos.
              </p>
              <p className="leading-relaxed">
                <strong>4.3 Acceso Restringido:</strong> Solo personal autorizado tiene acceso a los datos,
                y bajo estrictos protocolos de seguridad.
              </p>
              <p className="leading-relaxed">
                <strong>4.4 Tokens OAuth:</strong> Los tokens de acceso de redes sociales se almacenan
                encriptados y se utilizan únicamente para acceder a las APIs autorizadas por usted.
              </p>
              <p className="leading-relaxed">
                <strong>4.5 Ubicación de Datos:</strong> Los datos se almacenan en servidores seguros
                ubicados en la nube con certificaciones de seguridad internacionales.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              5. Compartir Información con Terceros
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>5.1 No Vendemos sus Datos:</strong> Nunca vendemos, alquilamos o comercializamos
                su información personal a terceros.
              </p>
              <p className="leading-relaxed">
                <strong>5.2 Proveedores de Servicios:</strong> Compartimos información limitada con:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-8">
                <li>Wompi (procesamiento de pagos)</li>
                <li>Supabase (almacenamiento de base de datos)</li>
                <li>OpenAI/DeepSeek (análisis AI - datos anonimizados)</li>
                <li>Google Gemini (asistente AI - datos anonimizados)</li>
              </ul>
              <p className="leading-relaxed mt-3">
                <strong>5.3 APIs de Redes Sociales:</strong> Accedemos a las APIs de Facebook, X/Twitter,
                Instagram, YouTube, TikTok, LinkedIn y Threads únicamente con los permisos que usted otorga
                y para proporcionar nuestros servicios de monitoreo.
              </p>
              <p className="leading-relaxed">
                <strong>5.4 Requerimientos Legales:</strong> Podemos divulgar información si es requerido
                por ley o para proteger nuestros derechos legales.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              6. Integración con TikTok
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>6.1 Datos Recopilados de TikTok:</strong> Cuando conecta su cuenta de TikTok,
                accedemos únicamente a:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-8">
                <li>Información básica del usuario (open_id, union_id, display_name, avatar)</li>
                <li>Métricas públicas (follower_count, following_count, likes_count, video_count)</li>
                <li>Lista de videos públicos con sus métricas</li>
              </ul>
              <p className="leading-relaxed mt-3">
                <strong>6.2 Permisos de TikTok:</strong> Solicitamos los siguientes scopes:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-8">
                <li><code className="bg-slate-100 px-2 py-1 rounded">user.info.basic</code> - Información básica de perfil (ID, nombre, avatar)</li>
                <li><code className="bg-slate-100 px-2 py-1 rounded">user.info.stats</code> - Estadísticas del usuario (seguidores, likes, conteo de videos)</li>
                <li><code className="bg-slate-100 px-2 py-1 rounded">user.info.profile</code> - Detalles de perfil (biografía, verificación, enlaces)</li>
                <li><code className="bg-slate-100 px-2 py-1 rounded">video.list</code> - Lista de videos públicos con métricas</li>
              </ul>
              <p className="leading-relaxed mt-3">
                <strong>6.3 Propósito:</strong> Utilizamos estos datos exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-8">
                <li>Mostrar sus métricas de TikTok en el dashboard</li>
                <li>Analizar el rendimiento de sus videos</li>
                <li>Generar reportes de reputación que incluyan su presencia en TikTok</li>
                <li>Monitorear menciones y engagement</li>
              </ul>
              <p className="leading-relaxed mt-3">
                <strong>6.4 Revocación:</strong> Puede desconectar su cuenta de TikTok en cualquier momento
                desde la configuración de redes sociales. Esto revocará el acceso inmediatamente y eliminará
                los tokens de nuestra base de datos.
              </p>
              <p className="leading-relaxed">
                <strong>6.5 Cumplimiento TikTok:</strong> Cumplimos estrictamente con las{' '}
                <a
                  href="https://developers.tiktok.com/doc/tiktok-api-terms-of-service"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TikTok API Terms of Service
                </a>
                {' '}y{' '}
                <a
                  href="https://www.tiktok.com/legal/privacy-policy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TikTok Privacy Policy
                </a>
                .
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              7. Sus Derechos (GDPR y Ley 1581 de 2012 - Colombia)
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li><strong>Acceso:</strong> Solicitar una copia de todos los datos personales que tenemos sobre usted</li>
              <li><strong>Rectificación:</strong> Corregir información inexacta o desactualizada</li>
              <li><strong>Eliminación:</strong> Solicitar la eliminación de su cuenta y todos sus datos</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado y legible</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos personales</li>
              <li><strong>Limitación:</strong> Solicitar la limitación del procesamiento en ciertos casos</li>
              <li><strong>Revocación:</strong> Revocar el consentimiento para el tratamiento de datos en cualquier momento</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Para ejercer estos derechos, contáctenos en: <strong>privacidad@reputaciononline.com.co</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              8. Retención de Datos
            </h2>
            <div className="space-y-3 text-slate-700">
              <p className="leading-relaxed">
                <strong>8.1 Cuenta Activa:</strong> Mantenemos sus datos mientras su cuenta esté activa
                y sea necesario para proporcionar nuestros servicios.
              </p>
              <p className="leading-relaxed">
                <strong>8.2 Tokens OAuth:</strong> Los tokens de acceso se mantienen mientras la conexión
                esté activa. Son eliminados inmediatamente al desconectar una red social.
              </p>
              <p className="leading-relaxed">
                <strong>8.3 Cuenta Cerrada:</strong> Cuando cierre su cuenta, eliminaremos sus datos
                personales dentro de 90 días, excepto información que debamos retener por obligaciones legales.
              </p>
              <p className="leading-relaxed">
                <strong>8.4 Backups:</strong> Los respaldos automáticos se eliminan después de 30 días.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              9. Menores de Edad
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Nuestra plataforma no está dirigida a menores de 18 años. No recopilamos intencionalmente
              información de menores. Si descubrimos que hemos recopilado datos de un menor, eliminaremos
              esa información inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              10. Transferencias Internacionales de Datos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de Colombia.
              Nos aseguramos de que todas las transferencias cumplan con las leyes de protección de datos
              aplicables y se realicen con las garantías de seguridad apropiadas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              11. Cambios a esta Política
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre
              cambios significativos mediante correo electrónico o un aviso destacado en la Plataforma.
              Le recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              12. Responsable del Tratamiento de Datos
            </h2>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700">
                <strong>Razón Social:</strong> Reputación Online
              </p>
              <p className="text-slate-700 mt-2">
                <strong>País:</strong> Colombia
              </p>
              <p className="text-slate-700 mt-2">
                <strong>Email de Privacidad:</strong> privacidad@reputaciononline.com.co
              </p>
              <p className="text-slate-700 mt-2">
                <strong>Email de Soporte:</strong> soporte@reputaciononline.com.co
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

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              13. Contacto
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Si tiene preguntas sobre esta Política de Privacidad o sobre cómo manejamos sus datos
              personales, puede contactarnos en:
            </p>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-slate-700">
                <strong>Email principal:</strong> privacidad@reputaciononline.com.co
              </p>
              <p className="text-slate-700 mt-2">
                <strong>Para ejercer derechos HABEAS DATA:</strong> privacidad@reputaciononline.com.co
              </p>
              <p className="text-slate-700 mt-2">
                <strong>Soporte general:</strong> soporte@reputaciononline.com.co
              </p>
            </div>
          </section>

          <section className="border-t pt-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Esta Política de Privacidad cumple con la Ley 1581 de 2012 de Colombia (Ley de Protección
              de Datos Personales), el Decreto 1377 de 2013, y está alineada con principios del GDPR
              (Reglamento General de Protección de Datos de la Unión Europea) para ofrecer las mejores
              prácticas de privacidad a nuestros usuarios.
            </p>
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
