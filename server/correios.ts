interface CorreiosAuthResponse {
  token: string;
  expiraEm: string;
}

interface ShippingOption {
  service: string;
  serviceCode: string;
  price: number;
  deadline: number;
  error?: string;
}

interface ShippingRequest {
  originCep: string;
  destinationCep: string;
  weight: number;
  height: number;
  width: number;
  length: number;
  services: string[];
}

const SERVICE_NAMES: Record<string, string> = {
  "03298": "PAC",
  "03220": "SEDEX",
  "03337": "Mini Envios",
  "04510": "PAC",
  "04014": "SEDEX",
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function authenticate(): Promise<string | null> {
  const usuario = process.env.CORREIOS_USUARIO;
  const senha = process.env.CORREIOS_SENHA;
  const cartaoPostagem = process.env.CORREIOS_CARTAO_POSTAGEM;

  if (!usuario || !senha || !cartaoPostagem) {
    return null;
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  try {
    const response = await fetch("https://api.correios.com.br/token/v1/autentica/cartaopostagem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${usuario}:${senha}`).toString("base64"),
      },
      body: JSON.stringify({ numero: cartaoPostagem }),
    });

    if (!response.ok) {
      console.error("Correios auth error:", response.status, await response.text());
      return null;
    }

    const data = await response.json() as CorreiosAuthResponse;
    cachedToken = {
      token: data.token,
      expiresAt: Date.now() + (23 * 60 * 60 * 1000),
    };
    return data.token;
  } catch (err) {
    console.error("Correios auth error:", err);
    return null;
  }
}

export async function calculateShipping(req: ShippingRequest): Promise<ShippingOption[]> {
  const token = await authenticate();
  if (!token) {
    return [];
  }

  const results: ShippingOption[] = [];

  for (const serviceCode of req.services) {
    try {
      const response = await fetch("https://api.correios.com.br/preco/v1/nacional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          coProduto: serviceCode,
          cepOrigem: req.originCep.replace(/\D/g, ""),
          cepDestino: req.destinationCep.replace(/\D/g, ""),
          psObjeto: req.weight,
          tpObjeto: 2,
          comprimento: req.length,
          largura: req.width,
          altura: req.height,
          vlDeclarado: 0,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Correios price error (${serviceCode}):`, errText);
        continue;
      }

      const data = await response.json();

      results.push({
        service: SERVICE_NAMES[serviceCode] || serviceCode,
        serviceCode,
        price: parseFloat(data.pcFinal || data.pcBase || "0"),
        deadline: parseInt(data.prazoEntrega || "0"),
      });
    } catch (err) {
      console.error(`Correios calc error (${serviceCode}):`, err);
    }
  }

  return results;
}

export function isCorreiosConfigured(): boolean {
  return !!(
    process.env.CORREIOS_USUARIO &&
    process.env.CORREIOS_SENHA &&
    process.env.CORREIOS_CARTAO_POSTAGEM
  );
}
