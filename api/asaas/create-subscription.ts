
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;
const ASAAS_ENV = process.env.ASAAS_ENVIRONMENT || 'sandbox';
const ASAAS_BASE_URL = ASAAS_ENV === 'production' 
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Garantir que sempre responderemos JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, userId, billingType = 'UNDEFINED' } = req.body;

    if (!planId || !userId) {
      return res.status(400).json({ error: 'planId e userId são obrigatórios.' });
    }

    // 1. Buscar Usuário e Plano
    const { data: user, error: userErr } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: plan, error: planErr } = await supabase.from('license_plans').select('*').eq('id', planId).single();

    if (!user || !plan) {
      return res.status(404).json({ error: 'Usuário ou Plano não encontrado no banco.' });
    }

    if (!user.cpf_cnpj) {
      return res.status(400).json({ error: 'Você precisa preencher seu CPF/CNPJ no perfil antes de assinar.' });
    }

    // 2. Garantir Cliente no Asaas
    let asaasCustomerId = user.asaas_customer_id;
    if (!asaasCustomerId) {
      const customerPayload = {
        name: user.name,
        email: user.email,
        cpfCnpj: user.cpf_cnpj.replace(/\D/g, ''),
        externalReference: userId
      };

      const resp = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
        body: JSON.stringify(customerPayload)
      });
      
      const cData = await resp.json();
      if (!resp.ok) throw new Error(cData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
      
      asaasCustomerId = cData.id;
      await supabase.from('profiles').update({ asaas_customer_id: asaasCustomerId }).eq('id', userId);
    }

    // 3. Criar Assinatura no Asaas
    const cycleMap: any = { 'Mensal': 'MONTHLY', 'Anual': 'YEARLY', 'Vitalícia': 'MONTHLY' };
    
    const subscriptionPayload = {
      customer: asaasCustomerId,
      billingType: billingType === 'UNDEFINED' ? 'PIX' : billingType,
      value: plan.price,
      nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
      cycle: cycleMap[plan.type] || 'MONTHLY',
      description: `Assinatura ${plan.name} - Babylon Fin`,
      externalReference: planId,
      // CRITICAL: Para PIX em assinaturas, isso força a criação imediata da primeira cobrança
      notifyPaymentCreatedImmediately: true 
    };

    const subResp = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
      body: JSON.stringify(subscriptionPayload)
    });

    const subData = await subResp.json();
    if (!subResp.ok) throw new Error(subData.errors?.[0]?.description || 'Erro ao gerar assinatura no Asaas');

    // 4. Buscar a cobrança gerada (Aguardar brevemente para o Asaas processar a fila)
    await new Promise(r => setTimeout(r, 1500));
    const payResp = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subData.id}/payments`, {
      headers: { 'access_token': ASAAS_API_KEY }
    });
    const payData = await payResp.json();
    const firstPayment = payData.data?.[0];

    if (!firstPayment) {
      throw new Error("Assinatura criada, mas a primeira fatura ainda não foi gerada pelo gateway. Tente novamente em instantes.");
    }

    // 5. Inserir Licença (Pendente)
    const { data: newLicense, error: licError } = await supabase.from('licenses').insert([{
      user_id: userId,
      plan_id: planId,
      name: plan.name,
      type: plan.type,
      value: plan.price,
      status: 'Pendente',
      frequency: plan.type,
      asaas_subscription_id: subData.id,
      asaas_payment_id: firstPayment.id
    }]).select().single();

    if (licError) throw new Error("Erro ao registrar licença no banco: " + licError.message);

    // 6. Inserir Invoice
    const { error: invError } = await supabase.from('invoices').insert({
      user_id: userId,
      license_id: newLicense.id,
      amount: plan.price,
      status: 'Pendente',
      asaas_payment_id: firstPayment.id,
      invoice_url: firstPayment.invoiceUrl || firstPayment.bankSlipUrl,
      description: `Fatura ${plan.name}`
    });

    // 7. Tentar obter PIX (Se falhar, não trava o processo principal)
    let pixData = null;
    if (billingType === 'PIX' || firstPayment.billingType === 'PIX') {
      try {
        const qrCodeRes = await fetch(`${ASAAS_BASE_URL}/payments/${firstPayment.id}/pixQrCode`, {
          headers: { 'access_token': ASAAS_API_KEY }
        });
        if (qrCodeRes.ok) {
          const qrData = await qrCodeRes.json();
          pixData = { qrCode: qrData.encodedImage, copyPaste: qrData.payload };
        }
      } catch (pixErr) {
        console.warn("Falha não-crítica ao gerar QR Code PIX:", pixErr);
        // O usuário usará o invoiceUrl como fallback
      }
    }

    return res.status(200).json({ 
      success: true,
      subscriptionId: subData.id,
      paymentId: firstPayment.id,
      invoiceUrl: firstPayment.invoiceUrl || firstPayment.bankSlipUrl,
      pixData
    });

  } catch (error: any) {
    console.error("[ASAAS API ERROR]", error.message);
    return res.status(500).json({ error: error.message });
  }
}
