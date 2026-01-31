import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ✅ FUNÇÃO PARA BUSCAR TOKEN (BANCO OU VERCEL)
async function getWebhookToken() {
  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('asaas_webhook_token')
      .eq('id', 'main')
      .single();

    if (settings?.asaas_webhook_token) {
      return settings.asaas_webhook_token;
    }
  } catch (error) {
    console.warn('[WEBHOOK] Usando token do Vercel');
  }

  return process.env.ASAAS_WEBHOOK_TOKEN;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const WEBHOOK_TOKEN = await getWebhookToken();
    const asaasToken = req.headers['asaas-access-token'];

    if (WEBHOOK_TOKEN && asaasToken !== WEBHOOK_TOKEN) {
      console.error("[WEBHOOK] Token inválido");
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event: eventType, payment } = req.body;
    
    if (!payment) {
      return res.status(200).json({ success: true, message: 'No payment data' });
    }

    console.log(`[WEBHOOK] Evento: ${eventType} | Payment: ${payment.id}`);

    if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
      
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('asaas_payment_id', payment.id)
        .maybeSingle();

      if (invoice) {
        await supabase.from('invoices').update({ 
          status: 'Pago',
          confirmed_at: new Date().toISOString()
        }).eq('id', invoice.id);

        const { data: license } = await supabase
          .from('licenses')
          .select('*')
          .eq('asaas_payment_id', payment.id)
          .maybeSingle();

        if (license) {
          const expDate = new Date();
          if (license.type === 'Anual') {
            expDate.setFullYear(expDate.getFullYear() + 1);
          } else {
            expDate.setMonth(expDate.getMonth() + 1);
          }

          await supabase.from('licenses').update({
            status: 'Ativa',
            expiration_date: expDate.toISOString().split('T')[0]
          }).eq('id', license.id);

          await supabase.from('licenses')
            .update({ status: 'Expirada' })
            .eq('user_id', license.user_id)
            .neq('id', license.id);

          await supabase.from('profiles').update({ 
            active_license_id: license.id 
          }).eq('id', license.user_id);
          
          console.log(`[WEBHOOK SUCCESS] Licença ${license.id} ativada para usuário ${license.user_id}`);
        }
      }
    }

    return res.status(200).json({ success: true });
    
  } catch (error: any) {
    console.error('[WEBHOOK ERROR]', error.message);
    return res.status(500).json({ error: error.message });
  }
}
