import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Buscar configurações (banco ou Vercel)
async function getAsaasConfig() {
  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('asaas_api_key, asaas_environment')
      .eq('id', 'main')
      .single();

    if (settings?.asaas_api_key) {
      console.log('[CONFIG] Usando credenciais do banco de dados');
      return {
        apiKey: settings.asaas_api_key,
        environment: settings.asaas_environment || 'sandbox'
      };
    }
  } catch (error) {
    console.warn('[CONFIG] Banco indisponível, usando variáveis do Vercel');
  }

  const apiKey = process.env.ASAAS_API_KEY;
  const environment = process.env.ASAAS_ENVIRONMENT || 'sandbox';

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  console.log('[CONFIG] Usando credenciais do Vercel');
  return { apiKey, environment };
}

// ✅ VALIDAR E CRIAR/ATUALIZAR CLIENTE NO ASAAS
async function ensureAsaasCustomer(user: any, ASAAS_API_KEY: string, ASAAS_BASE_URL: string) {
  // Validações básicas
  if (!user.name || !user.email) {
    throw new Error('Nome e email são obrigatórios no perfil.');
  }

  if (!user.cpf_cnpj) {
    throw new Error('CPF/CNPJ é obrigatório. Atualize seu perfil antes de assinar.');
  }

  // Limpar CPF/CNPJ (remover caracteres especiais)
  const cpfCnpjClean = user.cpf_cnpj.replace(/\D/g, '');

  // Validar tamanho do CPF/CNPJ
  if (cpfCnpjClean.length !== 11 && cpfCnpjClean.length !== 14) {
    throw new Error('CPF/CNPJ inválido. Deve ter 11 (CPF) ou 14 (CNPJ) dígitos.');
  }

  let asaasCustomerId = user.asaas_customer_id;

  // ✅ SE JÁ TEM ID, VERIFICA SE O CLIENTE EXISTE NO ASAAS
  if (asaasCustomerId) {
    try {
      const checkResp = await fetch(`${ASAAS_BASE_URL}/customers/${asaasCustomerId}`, {
        method: 'GET',
        headers: { 'access_token': ASAAS_API_KEY }
      });

      if (checkResp.ok) {
        const customerData = await checkResp.json();
        
        // Cliente existe e está ativo
        if (!customerData.deleted) {
          console.log(`[ASAAS] Cliente ${asaasCustomerId} já existe e está ativo`);
          return asaasCustomerId;
        }
        
        // Cliente foi deletado, precisa criar novo
        console.warn(`[ASAAS] Cliente ${asaasCustomerId} foi deletado, criando novo...`);
        asaasCustomerId = null;
      } else {
        // Cliente não existe mais
        console.warn(`[ASAAS] Cliente ${asaasCustomerId} não encontrado, criando novo...`);
        asaasCustomerId = null;
      }
    } catch (error) {
      console.error('[ASAAS] Erro ao verificar cliente:', error);
      asaasCustomerId = null;
    }
  }

  // ✅ CRIAR NOVO CLIENTE NO ASAAS
  const customerPayload = {
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    cpfCnpj: cpfCnpjClean,
    mobilePhone: user.whatsapp ? user.whatsapp.replace(/\D/g, '') : undefined,
    externalReference: user.id,
    notificationDisabled: false
  };

  console.log('[ASAAS] Criando novo cliente:', { 
    name: customerPayload.name, 
    email: customerPayload.email,
    cpfCnpj: customerPayload.cpfCnpj 
  });

  const createResp = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'access_token': ASAAS_API_KEY 
    },
    body: JSON.stringify(customerPayload)
  });

  const createData = await createResp.json();

  if (!createResp.ok) {
    console.error('[ASAAS CUSTOMER ERROR]', createData);
    
    // Tratamento de erros específicos
    if (createData.errors) {
      const errorMsg = createData.errors[0]?.description || 'Erro ao criar cliente no Asaas';
      
      // Se CPF/CNPJ já existe, tenta buscar o cliente
      if (errorMsg.includes('CPF/CNPJ já cadastrado') || errorMsg.includes('already exists')) {
        console.log('[ASAAS] CPF/CNPJ já existe, buscando cliente...');
        
        try {
          // Buscar cliente por CPF/CNPJ
          const searchResp = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${cpfCnpjClean}`, {
            headers: { 'access_token': ASAAS_API_KEY }
          });
          
          const searchData = await searchResp.json();
          
          if (searchData.data && searchData.data.length > 0) {
            const existingCustomer = searchData.data[0];
            console.log(`[ASAAS] Cliente encontrado: ${existingCustomer.id}`);
            
            // Atualizar no banco
            await supabase
              .from('profiles')
              .update({ asaas_customer_id: existingCustomer.id })
              .eq('id', user.id);
            
            return existingCustomer.id;
          }
        } catch (searchError) {
          console.error('[ASAAS] Erro ao buscar cliente existente:', searchError);
        }
      }
      
      throw new Error(errorMsg);
    }
    
    throw new Error('Erro ao criar cliente no Asaas');
  }

  asaasCustomerId = createData.id;
  console.log(`[ASAAS] Novo cliente criado: ${asaasCustomerId}`);

  // ✅ ATUALIZAR asaas_customer_id NO BANCO
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ asaas_customer_id: asaasCustomerId })
    .eq('id', user.id);

  if (updateError) {
    console.error('[SUPABASE] Erro ao atualizar asaas_customer_id:', updateError);
    // Não falha a operação, apenas loga o erro
  }

  return asaasCustomerId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Buscar configurações do Asaas
    const { apiKey: ASAAS_API_KEY, environment: ASAAS_ENV } = await getAsaasConfig();
    
    const ASAAS_BASE_URL = ASAAS_ENV === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    const { planId, userId, billingType = 'UNDEFINED' } = req.body;

    if (!planId || !userId) {
      return res.status(400).json({ error: 'planId e userId são obrigatórios.' });
    }

    // 1. Buscar Usuário e Plano
    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: plan, error: planErr } = await supabase
      .from('license_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (userErr || !user) {
      console.error('[SUPABASE USER ERROR]', userErr);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (planErr || !plan) {
      console.error('[SUPABASE PLAN ERROR]', planErr);
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    // 2. ✅ GARANTIR CLIENTE NO ASAAS (COM VALIDAÇÕES)
    const asaasCustomerId = await ensureAsaasCustomer(user, ASAAS_API_KEY, ASAAS_BASE_URL);

    // 3. Criar Assinatura no Asaas
    const cycleMap: any = { 
      'Mensal': 'MONTHLY', 
      'Anual': 'YEARLY', 
      'Vitalícia': 'MONTHLY' 
    };
    
    const subscriptionPayload = {
      customer: asaasCustomerId,
      billingType: billingType === 'UNDEFINED' ? 'PIX' : billingType,
      value: plan.price,
      nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      cycle: cycleMap[plan.type] || 'MONTHLY',
      description: `Assinatura ${plan.name} - Babylon Fin`,
      externalReference: planId,
      notifyPaymentCreatedImmediately: true
    };

    console.log('[ASAAS] Criando assinatura:', {
      customer: asaasCustomerId,
      plan: plan.name,
      value: plan.price
    });

    const subResp = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'access_token': ASAAS_API_KEY 
      },
      body: JSON.stringify(subscriptionPayload)
    });

    const subData = await subResp.json();
    
    if (!subResp.ok) {
      console.error('[ASAAS SUBSCRIPTION ERROR]', subData);
      throw new Error(subData.errors?.[0]?.description || 'Erro ao gerar assinatura no Asaas');
    }

    console.log(`[ASAAS] Assinatura criada: ${subData.id}`);

    // 4. Buscar a primeira cobrança gerada
    await new Promise(r => setTimeout(r, 1500));
    
    const payResp = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subData.id}/payments`, {
      headers: { 'access_token': ASAAS_API_KEY }
    });
    
    const payData = await payResp.json();
    const firstPayment = payData.data?.[0];

    if (!firstPayment) {
      throw new Error("Assinatura criada, mas a primeira fatura ainda não foi gerada. Tente novamente em instantes.");
    }

    console.log(`[ASAAS] Primeira cobrança criada: ${firstPayment.id}`);

    // 5. Inserir Licença
    const { data: newLicense, error: licError } = await supabase
      .from('licenses')
      .insert([{
        user_id: userId,
        plan_id: planId,
        name: plan.name,
        type: plan.type,
        value: plan.price,
        status: 'Pendente',
        frequency: plan.type,
        asaas_subscription_id: subData.id,
        asaas_payment_id: firstPayment.id
      }])
      .select()
      .single();

    if (licError) {
      console.error('[LICENSE ERROR]', licError);
      throw new Error("Erro ao registrar licença: " + licError.message);
    }

    // 6. Inserir Invoice
    await supabase.from('invoices').insert({
      user_id: userId,
      license_id: newLicense.id,
      amount: plan.price,
      status: 'Pendente',
      asaas_payment_id: firstPayment.id,
      invoice_url: firstPayment.invoiceUrl || firstPayment.bankSlipUrl,
      description: `Fatura ${plan.name}`
    });

    // 7. Tentar obter PIX
    let pixData = null;
    if (billingType === 'PIX' || firstPayment.billingType === 'PIX') {
      try {
        const qrCodeRes = await fetch(`${ASAAS_BASE_URL}/payments/${firstPayment.id}/pixQrCode`, {
          headers: { 'access_token': ASAAS_API_KEY }
        });
        
        if (qrCodeRes.ok) {
          const qrData = await qrCodeRes.json();
          pixData = { 
            qrCode: qrData.encodedImage, 
            copyPaste: qrData.payload 
          };
        }
      } catch (pixErr) {
        console.warn("[PIX] Falha ao gerar QR Code:", pixErr);
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
    console.error("[CREATE SUBSCRIPTION ERROR]", error.message);
    return res.status(500).json({ error: error.message });
  }
}
