/**
 * API para gestion de alertas de crisis
 * GET: obtener alertas activas del usuario
 * PATCH: actualizar estado de alerta (acknowledge, resolve)
 */

import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase-server';

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })();

function getUserId(request: NextRequest): string | null {
  const authToken = request.cookies.get('auth-token')?.value;
  if (!authToken) return null;
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('crisis_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: alerts, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: alerts || [],
      count: alerts?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { alertId, status } = await request.json();

    if (!alertId || !status) {
      return NextResponse.json({ success: false, error: 'alertId y status requeridos' }, { status: 400 });
    }

    const validStatuses = ['active', 'acknowledged', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `Status invalido. Usar: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'acknowledged') {
      updateData.acknowledged_at = new Date().toISOString();
    } else if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('crisis_alerts')
      .update(updateData)
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
