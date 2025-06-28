import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const mediaSources = await db.mediaSource.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(mediaSources)
  } catch (error) {
    console.error('Error fetching media sources:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, category, description } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Nombre y URL son requeridos' }, 
        { status: 400 }
      )
    }

    // Verificar si ya existe un medio con esa URL
    const existingMedia = await db.mediaSource.findUnique({
      where: { url }
    })

    if (existingMedia) {
      return NextResponse.json(
        { error: 'Ya existe un medio con esa URL' }, 
        { status: 409 }
      )
    }

    const newMediaSource = await db.mediaSource.create({
      data: {
        name,
        url,
        category: category || 'personalizado',
        description,
        isDefault: false,
        isActive: true
      }
    })

    return NextResponse.json(newMediaSource, { status: 201 })
  } catch (error) {
    console.error('Error creating media source:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
