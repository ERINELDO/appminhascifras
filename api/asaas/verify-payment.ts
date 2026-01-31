import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ✅ FUNÇÃO PARA BUSCAR CREDENCIAIS (BANCO OU VERCEL)
async function getAsaasConfig() {
  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('asaas_api_key, asaas_environment')
      .eq('id', 'main')
      .single();

    if (settings?.asaas_api_key) {
      return {
        apiKey: settings.asaas_api_key,
        environment: settings.asaas_environment || 'sandbox'
      };
    }
  } catch (error) {
    console.warn('[VERIFY] Usando credenciais do Vercel');
  }

  return {
    apiKey: process.env.ASAAS_API_KEY!,
    environment: process.env.ASAAS_ENVIRONMENT || 'sandbox'
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  try {
    const { apiKey, environment } = await getAsaasConfig();
    
    const ASAAS_BASE_URL = environment === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    const response = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
      headers: { 'access_token': apiKey }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[ASAAS VERIFY ERROR]', errorData);
      throw new Error('Falha ao consultar pagamento');
    }
    
    const payment = await response.json();
    const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status);

    return res.status(200).json({ 
      success: isPaid, 
      status: payment.status
    });
    
  } catch (error: any) {
    console.error('[VERIFY ERROR]', error.message);
    return res.status(500).json({ error: error.message });
  }
}
