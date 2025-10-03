import { NextResponse } from 'next/server';
import { getMaisVendidosCSV } from '@/lib/maisVendidos';

export async function GET() {
  try {
    const produtos = getMaisVendidosCSV();
    return NextResponse.json(produtos);
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao carregar CSV' }, { status: 500 });
  }
}
