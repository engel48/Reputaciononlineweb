import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Users, AlertTriangle, Check, Loader2 } from 'lucide-react';

export default function AsignacionMasiva() {
  // Estados para manejar el proceso
  const [paso, setPaso] = useState<number>(1);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string>('');
  const [exito, setExito] = useState<boolean>(false);

  // Simulación de usuarios para ejemplo
  const usuariosSimulados = [
    { id: 'u1', nombre: 'Carlos Rodríguez', email: 'carlos@ejemplo.com', creditos: 5000 },
    { id: 'u2', nombre: 'María López', email: 'maria@ejemplo.com', creditos: 10000 },
    { id: 'u3', nombre: 'Juan Martínez', email: 'juan@ejemplo.com', creditos: 7500 },
    { id: 'u4', nombre: 'Ana Gómez', email: 'ana@ejemplo.com', creditos: 3000 },
    { id: 'u5', nombre: 'Pedro Sánchez', email: 'pedro@ejemplo.com', creditos: 15000 },
  ];

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setArchivo(files[0]);
      setErrorMensaje('');
    }
  };

  // Procesar archivo
  const procesarArchivo = () => {
    if (!archivo) {
      setErrorMensaje('Por favor selecciona un archivo CSV o Excel');
      return;
    }

    setCargando(true);
    setErrorMensaje('');

    // Simulamos procesamiento del archivo
    setTimeout(() => {
      setCargando(false);
      // Usar datos simulados para ejemplo
      setUsuarios(usuariosSimulados);
      setPaso(2);
    }, 1500);
  };

  // Confirmar asignación
  const confirmarAsignacion = () => {
    setCargando(true);

    // Simulamos el proceso de asignación
    setTimeout(() => {
      setCargando(false);
      setExito(true);
      setPaso(3);
    }, 2000);
  };

  // Reiniciar el proceso
  const reiniciarProceso = () => {
    setPaso(1);
    setArchivo(null);
    setUsuarios([]);
    setErrorMensaje('');
    setExito(false);
  };

  return (
    <div className="card p-6">
      <h2 className="heading-secondary mb-4">Asignación Masiva de Créditos</h2>

      {/* Pasos */}
      <div className="mb-8">
        <div className="flex justify-between">
          {[1, 2, 3].map((step) => (
            <div 
              key={step}
              className="flex flex-1 flex-col items-center"
            >
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full ${paso === step ? 'bg-primary-600 text-white dark:bg-primary-500' : paso > step ? 'bg-green-500 text-white dark:bg-green-600' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}
              >
                {paso > step ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {step === 1 ? 'Subir Archivo' : step === 2 ? 'Confirmar Usuarios' : 'Completado'}
              </p>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 transform rounded bg-gray-200 dark:bg-gray-700"></div>
          <div 
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 transform rounded bg-primary-600 transition-all dark:bg-primary-500"
            style={{ width: `${((paso - 1) / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Contenido según el paso */}
      <div className="mt-6">
        {paso === 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Upload className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            
            <h3 className="mb-2 text-center text-lg font-medium text-gray-900 dark:text-white">
              Subir Archivo de Usuarios
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Sube un archivo CSV o Excel con la lista de usuarios y la cantidad de créditos a asignar.
            </p>
            
            <div className="mb-4 w-full max-w-md">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
                <input
                  type="file"
                  id="archivo"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                />
                <label
                  htmlFor="archivo"
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  <Upload className="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {archivo ? archivo.name : 'Haz clic para seleccionar archivo'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    CSV, Excel (.xlsx, .xls)
                  </p>
                </label>
              </div>
            </div>

            {errorMensaje && (
              <div className="mb-4 flex w-full max-w-md items-center rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {errorMensaje}
              </div>
            )}

            <div className="mt-2 flex justify-end space-x-3">
              <button
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                onClick={reiniciarProceso}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
                onClick={procesarArchivo}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Procesar Archivo'
                )}
              </button>
            </div>

            <div className="mt-6 w-full max-w-md rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <h4 className="mb-2 font-medium text-blue-700 dark:text-blue-400">Formato de archivo requerido</h4>
              <p className="mb-2 text-sm text-blue-600 dark:text-blue-300">
                El archivo debe contener las siguientes columnas:
              </p>
              <ul className="list-inside list-disc text-sm text-blue-600 dark:text-blue-300">
                <li>email (correo del usuario)</li>
                <li>creditos (cantidad a asignar)</li>
                <li>canal (opcional, por defecto 'general')</li>
                <li>descripcion (opcional)</li>
              </ul>
            </div>
          </motion.div>
        )}

        {paso === 2 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Confirmar Asignación de Créditos
              </h3>
            </div>

            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Se asignarán créditos a los siguientes usuarios. Revisa la información antes de confirmar.
            </p>

            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Créditos a Asignar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {usuario.nombre}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {usuario.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-primary-600 dark:text-primary-400">
                        {usuario.creditos.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total de créditos a asignar:
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-bold text-primary-600 dark:text-primary-400">
                      {usuarios.reduce((sum, u) => sum + u.creditos, 0).toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                onClick={() => setPaso(1)}
                disabled={cargando}
              >
                Volver
              </button>
              <button
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
                onClick={confirmarAsignacion}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar Asignación'
                )}
              </button>
            </div>
          </motion.div>
        )}

        {paso === 3 && exito && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Asignación Completada
            </h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Se han asignado créditos a {usuarios.length} usuarios exitosamente.
            </p>
            
            <div className="mb-6 w-full max-w-md rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm text-green-700 dark:text-green-400">
                Total de créditos asignados: {usuarios.reduce((sum, u) => sum + u.creditos, 0).toLocaleString('es-CO')}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
                onClick={reiniciarProceso}
              >
                Nueva Asignación
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
