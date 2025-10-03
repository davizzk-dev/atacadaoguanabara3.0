
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Função para ler e parsear o CSV dos mais vendidos
export function getMaisVendidosCSV(): { nome: string }[] {
  const csvPath = path.join(process.cwd(), 'data', 'relatorioABCVenda.csv');
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split(/\r?\n/).filter(Boolean);
    // Pega índice da coluna "Descrição" no cabeçalho
    const header = lines[0].split(';');
    const idxDescricao = header.findIndex(h => h.toLowerCase().includes('descri'));
    const startIdx = 1; // sempre pula cabeçalho
    return lines.slice(startIdx).map(line => {
      const cols = line.split(';');
      const nome = cols[idxDescricao]?.trim();
      return { nome };
    }).filter(p => p.nome && p.nome.length > 0);
  } catch (err) {
    console.error('Erro ao ler CSV:', err);
    return [];
  }
}

// API Route
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const maisVendidos = getMaisVendidosCSV();
    res.status(200).json(maisVendidos);
  } catch (error) {
    console.error('Erro ao buscar mais vendidos:', error);
    res.status(500).json({ error: 'Erro ao carregar produtos mais vendidos' });
  }
}