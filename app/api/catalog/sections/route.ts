import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const productsFilePath = path.join(process.cwd(), 'products.json');
    
    if (!fs.existsSync(productsFilePath)) {
      return NextResponse.json([]);
    }

    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    const products = JSON.parse(productsData);

    // Organizar produtos por seções e grupos
    const sectionsMap = new Map();
    const groupsMap = new Map();

    products.forEach((product: any) => {
      if (!product.varejoFacilData) return;

      const { secaoId, secaoNome, grupoId, grupoNome } = product.varejoFacilData;
      
      // Adicionar seção se não existir
      if (secaoId && secaoNome && !sectionsMap.has(secaoId)) {
        sectionsMap.set(secaoId, {
          id: secaoId,
          nome: secaoNome,
          grupos: new Map(),
          totalProdutos: 0
        });
      }

      // Adicionar grupo à seção se não existir
      if (grupoId && grupoNome && sectionsMap.has(secaoId)) {
        const section = sectionsMap.get(secaoId);
        if (!section.grupos.has(grupoId)) {
          section.grupos.set(grupoId, {
            id: grupoId,
            nome: grupoNome,
            secaoId: secaoId,
            totalProdutos: 0
          });
        }
        // Incrementar contador de produtos no grupo
        const group = section.grupos.get(grupoId);
        group.totalProdutos++;
        
        // Incrementar contador de produtos na seção
        section.totalProdutos++;
      }
    });

    // Converter Maps para Arrays e organizar
    const sections = Array.from(sectionsMap.values()).map(section => ({
      ...section,
      grupos: Array.from(section.grupos.values()).sort((a, b) => a.nome.localeCompare(b.nome))
    })).sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Erro ao buscar seções:', error);
    return NextResponse.json([]);
  }
}