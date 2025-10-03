// lib/produtosFixos.ts

export interface ProdutoFixoCSV {
  nome: string;
  categoria?: string;
}

// Função para carregar e processar o CSV de produtos fixos
export const getProdutosFixosCSV = async (): Promise<ProdutoFixoCSV[]> => {
  try {
    // Fazendo fetch do arquivo CSV
    const response = await fetch('/data/relatorioABCVenda.csv');
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvData = await response.text();
    
    // Processando o CSV
    const linhas = csvData.split('\n').filter(linha => linha.trim() !== '');
    
    // Removendo o cabeçalho se existir
    if (linhas.length > 0 && linhas[0].toLowerCase().includes('nome')) {
      linhas.shift(); // Remove a primeira linha (cabeçalho)
    }
    
    const produtosFixos: ProdutoFixoCSV[] = [];
    
    for (const linha of linhas) {
      const colunas = linha.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (colunas.length >= 1 && colunas[0]) {
        produtosFixos.push({
          nome: colunas[0],
          categoria: colunas.length > 1 ? colunas[1] : undefined
        });
      }
    }
    
    return produtosFixos;
  } catch (error) {
    console.error('Erro ao carregar produtos fixos do CSV:', error);
    
    // Fallback para caso o CSV não esteja disponível
    return [
      { nome: "Arroz Branco Tipo 1", categoria: "Alimentos" },
      { nome: "Feijão Carioca", categoria: "Alimentos" },
      { nome: "Açúcar Refinado", categoria: "Alimentos" },
      { nome: "Café em Pó", categoria: "Alimentos" },
      { nome: "Óleo de Soja", categoria: "Alimentos" },
      { nome: "Sal Refinado", categoria: "Alimentos" },
      { nome: "Farinha de Trigo", categoria: "Alimentos" },
      { nome: "Macarrão Espaguete", categoria: "Alimentos" },
      { nome: "Leite Integral", categoria: "Laticínios" },
      { nome: "Manteiga", categoria: "Laticínios" },
      { nome: "Queijo Mussarela", categoria: "Laticínios" },
      { nome: "Iogurte Natural", categoria: "Laticínios" },
      { nome: "Ovos Brancos", categoria: "Alimentos" },
      { nome: "Pão de Forma", categoria: "Padaria" },
      { nome: "Biscoito Recheado", categoria: "Alimentos" },
      { nome: "Sabão em Pó", categoria: "Limpeza" },
      { nome: "Detergente Líquido", categoria: "Limpeza" },
      { nome: "Água Sanitária", categoria: "Limpeza" },
      { nome: "Amaciante de Roupas", categoria: "Limpeza" },
      { nome: "Papel Higiênico", categoria: "Higiene" }
    ];
  }
};