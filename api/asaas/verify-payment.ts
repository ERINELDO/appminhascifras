import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;
const ASAAS_ENV = process.env.ASAAS_ENVIRONMENT || 'sandbox';
const ASAAS_BASE_URL = ASAAS_ENV === 'production' 
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

  try {
    const response = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
      headers: { 'access_token': ASAAS_API_KEY }
    });
    
    if (!response.ok) throw new Error('Falha ao consultar Asaas');
    
    const payment = await response.json();
    const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status);

    return res.status(200).json({ 
      success: isPaid, 
      status: payment.status 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}