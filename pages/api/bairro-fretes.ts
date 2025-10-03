import type { NextApiRequest, NextApiResponse } from 'next'
import bairrosFrete from '../../data/bairros-frete.json'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }
  return res.status(200).json(bairrosFrete)
}
