import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

interface MediaSourceRow {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_default: boolean;
}

function toCamel(row: MediaSourceRow) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    category: row.category,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    isActive: row.is_active,
    isDefault: row.is_default,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('media_sources')
      .select('id, name, url, category, description, logo_url, is_active, is_default')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching media sources:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json((data ?? []).map(toCamel));
  } catch (error) {
    console.error('Error fetching media sources:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, category, description } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Nombre y URL son requeridos' },
        { status: 400 }
      );
    }

    const { data: existing, error: lookupError } = await supabase
      .from('media_sources')
      .select('id')
      .eq('url', url)
      .maybeSingle();

    if (lookupError) {
      console.error('Error checking existing media source:', lookupError);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un medio con esa URL' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('media_sources')
      .insert({
        name,
        url,
        category: category || 'personalizado',
        description: description ?? null,
        is_default: false,
        is_active: true,
      })
      .select('id, name, url, category, description, logo_url, is_active, is_default')
      .single();

    if (error || !data) {
      console.error('Error creating media source:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json(toCamel(data), { status: 201 });
  } catch (error) {
    console.error('Error creating media source:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
