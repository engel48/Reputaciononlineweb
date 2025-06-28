import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear medios de comunicación predeterminados (Colombia)
  const mediaSources = [
    // Medios nacionales
    { name: 'El Tiempo', url: 'https://www.eltiempo.com', category: 'nacional', description: 'Periódico nacional de Colombia', isDefault: true },
    { name: 'El Espectador', url: 'https://www.elespectador.com', category: 'nacional', description: 'Periódico nacional de Colombia', isDefault: true },
    { name: 'Semana', url: 'https://www.semana.com', category: 'nacional', description: 'Revista semanal de noticias', isDefault: true },
    { name: 'Caracol Radio', url: 'https://caracol.com.co', category: 'nacional', description: 'Cadena radial nacional', isDefault: true },
    { name: 'BluRadio', url: 'https://www.bluradio.com', category: 'nacional', description: 'Cadena radial nacional', isDefault: true },
    { name: 'RCN Radio', url: 'https://www.rcnradio.com', category: 'nacional', description: 'Cadena radial nacional', isDefault: true },
    { name: 'Noticias Caracol', url: 'https://noticias.caracoltv.com', category: 'nacional', description: 'Noticiero televisivo nacional', isDefault: true },
    { name: 'Noticias RCN', url: 'https://www.noticiasrcn.com', category: 'nacional', description: 'Noticiero televisivo nacional', isDefault: true },
    { name: 'CM&', url: 'https://www.cmi.com.co', category: 'nacional', description: 'Canal de televisión nacional', isDefault: true },
    { name: 'Canal 1', url: 'https://www.canal1.com.co', category: 'nacional', description: 'Canal de televisión nacional', isDefault: true },
    
    // Medios regionales
    { name: 'El Colombiano', url: 'https://www.elcolombiano.com', category: 'regional', description: 'Periódico de Medellín y Antioquia', isDefault: true },
    { name: 'El País', url: 'https://www.elpais.com.co', category: 'regional', description: 'Periódico de Cali y Valle del Cauca', isDefault: true },
    { name: 'El Heraldo', url: 'https://www.elheraldo.co', category: 'regional', description: 'Periódico de Barranquilla y Costa Caribe', isDefault: true },
    { name: 'El Universal', url: 'https://www.eluniversal.com.co', category: 'regional', description: 'Periódico de Cartagena y Bolívar', isDefault: true },
    { name: 'Vanguardia', url: 'https://www.vanguardia.com', category: 'regional', description: 'Periódico de Bucaramanga y Santander', isDefault: true },
    { name: 'La Opinión', url: 'https://www.laopinion.com.co', category: 'regional', description: 'Periódico de Cúcuta y Norte de Santander', isDefault: true },
    { name: 'Diario del Huila', url: 'https://www.diariodelhuila.com', category: 'regional', description: 'Periódico del Huila', isDefault: true },
    { name: 'La Patria', url: 'https://www.lapatria.com', category: 'regional', description: 'Periódico de Manizales y Caldas', isDefault: true },
    
    // Medios especializados
    { name: 'Portafolio', url: 'https://www.portafolio.co', category: 'especializado', description: 'Diario económico y financiero', isDefault: true },
    { name: 'La República', url: 'https://www.larepublica.co', category: 'especializado', description: 'Diario económico y empresarial', isDefault: true },
    { name: 'KIENYKE', url: 'https://www.kienyke.com', category: 'especializado', description: 'Medio digital de política y actualidad', isDefault: true },
    { name: 'Las2Orillas', url: 'https://www.las2orillas.co', category: 'especializado', description: 'Medio digital de opinión y análisis', isDefault: true },
    { name: 'El Nuevo Siglo', url: 'https://www.elnuevosiglo.com.co', category: 'especializado', description: 'Periódico de política y análisis', isDefault: true },
    { name: 'Razón Pública', url: 'https://www.razonpublica.com', category: 'especializado', description: 'Portal de análisis político y social', isDefault: true },
    
    // Medios internacionales relevantes
    { name: 'BBC Mundo', url: 'https://www.bbc.com/mundo', category: 'internacional', description: 'Servicio en español de BBC', isDefault: true },
    { name: 'CNN en Español', url: 'https://cnnespanol.cnn.com', category: 'internacional', description: 'Noticiero internacional en español', isDefault: true },
    { name: 'El País España', url: 'https://elpais.com', category: 'internacional', description: 'Diario español con cobertura latinoamericana', isDefault: true },
    { name: 'Infobae', url: 'https://www.infobae.com', category: 'internacional', description: 'Portal de noticias latinoamericano', isDefault: true },
  ]

  console.log('Creando medios de comunicación...')
  
  for (const media of mediaSources) {
    await prisma.mediaSource.upsert({
      where: { url: media.url },
      update: {},
      create: media,
    })
  }

  console.log('✅ Medios de comunicación creados exitosamente')

  // Crear usuarios de prueba
  const users = [
    {
      email: 'elmer.zapata@example.com',
      password: bcrypt.hashSync('password123', 10), 
      name: 'Elmer Zapata',
      company: 'Política Colombiana',
      phone: '+57 300 123 4567',
      bio: 'Líder político comprometido con el desarrollo social y económico del país.',
      role: 'user',
      plan: 'pro',
      credits: 2500,
      profileType: 'political',
      category: 'Sector político y gubernamental',
      onboardingCompleted: true,
    },
    {
      email: 'lucia.morales@example.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Lucía Morales',
      company: 'StartUp Tech',
      phone: '+57 301 987 6543',
      bio: 'Emprendedora en el sector tecnológico, enfocada en innovación y desarrollo digital.',
      role: 'user',
      plan: 'basic',
      credits: 500,
      profileType: 'business',
      category: 'Marca / empresa',
      brandName: 'StartUp Tech Solutions',
      onboardingCompleted: false,
    }
  ]

  console.log('Creando usuarios de prueba...')
  
  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
  }

  console.log('✅ Usuarios de prueba creados exitosamente')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
