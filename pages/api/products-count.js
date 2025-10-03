export default async function handler(req, res) {
  try {
    // Buscar produtos para contar
    const productsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/products`);
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const productsArray = Array.isArray(productsData) ? productsData : 
                          (Array.isArray(productsData?.data) ? productsData.data : []);
      
      res.status(200).json({ total: productsArray.length });
    } else {
      res.status(200).json({ total: 0 });
    }
  } catch (error) {
    console.error('Erro ao contar produtos:', error);
    res.status(200).json({ total: 0 });
  }
}