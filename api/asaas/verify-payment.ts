import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

  try {
    // ✅ BUSCAR CONFIGURAÇÕES DO BANCO
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('asaas_api_key, asaas_environment')
      .eq('id', 'main')
      .single();

    if (settingsError || !settings?.asaas_api_key) {
      console.error('[CONFIG ERROR]', settingsError);
      return res.status(500).json({ 
        error: 'Configurações do Asaas não encontradas. Configure em app_settings.' 
      });
    }

    const ASAAS_API_KEY = settings.asaas_api_key;
    const ASAAS_ENV = settings.asaas_environment || 'sandbox';
    const ASAAS_BASE_URL = ASAAS_ENV === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    // ✅ CORRIGIDO: fetch com template string correto
    const response = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
      headers: { 'access_token': ASAAS_API_KEY }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[ASAAS VERIFY ERROR]', errorData);
      throw new Error('Falha ao consultar pagamento no Asaas');
    }
    
    const payment = await response.json();
    const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status);

    return res.status(200).json({ 
      success: isPaid, 
      status: payment.status,
      payment: payment // Retorna dados completos do pagamento
    });
  } catch (error: any) {
    console.error('[VERIFY PAYMENT ERROR]', error.message);
    return res.status(500).json({ error: error.message });
  }
}
