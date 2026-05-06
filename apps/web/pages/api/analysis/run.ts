import type { NextApiRequest, NextApiResponse } from "next";
import type { ContractAnalysis } from "@/types";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContractAnalysis | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).end();

  // Simula tiempo de procesamiento de los MCPs
  await new Promise((r) => setTimeout(r, 4000));

  const result: ContractAnalysis = {
    entityName: "Banco de Chile",
    entityType: "Institución financiera",

    findings: [
      {
        id: "f1",
        status: "excede_ley",
        title: "Cesión de datos a terceros sin límite",
        quote: "Autoriza al banco a compartir su información con cualquier empresa del grupo y aliados comerciales.",
        explanation: "Sin especificar quiénes son ni para qué. Viola el principio de finalidad específica (Ley 19.628, Art. 4).",
        law: "Ley 19.628, Art. 4",
      },
      {
        id: "f2",
        status: "excede_ley",
        title: "Consentimiento genérico irrevocable",
        quote: "Al aceptar estos términos, el titular autoriza de forma indefinida el tratamiento de sus datos para todos los fines del banco.",
        explanation: "El consentimiento debe ser específico y revocable en cualquier momento. Incumple el Art. 12 de la Ley 19.628 y la futura Ley 21.719.",
        law: "Ley 19.628, Art. 12 · Ley 21.719",
      },
      {
        id: "f3",
        status: "excede_ley",
        title: "Transferencia internacional sin salvaguardas",
        quote: "Sus datos podrán ser procesados en servidores ubicados fuera de Chile sin restricción geográfica.",
        explanation: "La transferencia internacional requiere países con nivel adecuado de protección o garantías contractuales explícitas.",
        law: "Ley 21.719, Art. 28",
      },
      {
        id: "f4",
        status: "revisa",
        title: "Plazo de retención indefinido",
        quote: "Los datos se conservarán mientras exista relación contractual y por períodos adicionales según normativa interna.",
        explanation: "No establece plazo concreto. Recomendamos solicitar aclaración escrita sobre cuánto tiempo conservan cada categoría de dato.",
        law: "Ley 19.628, Art. 11",
      },
      {
        id: "f5",
        status: "revisa",
        title: "Uso de datos biométricos no detallado",
        quote: "Podemos recopilar datos de autenticación incluyendo huellas digitales y reconocimiento facial para su seguridad.",
        explanation: "Los datos biométricos son sensibles y requieren consentimiento explícito separado. El contrato no diferencia el tratamiento.",
        law: "Ley 21.719, Art. 16",
      },
      {
        id: "f6",
        status: "conforme",
        title: "Canal de reclamos identificado",
        quote: "El titular puede ejercer sus derechos ante la CMF y SERNAC en un plazo de 10 días hábiles.",
        explanation: "El contrato indica procedimiento de reclamo ante CMF y SERNAC. Plazo de respuesta cumple Ley Pro Consumidor.",
        law: "Ley 21.398, Art. 3",
      },
      {
        id: "f7",
        status: "conforme",
        title: "Derecho de acceso y rectificación informado",
        quote: "El titular tiene derecho a solicitar acceso, rectificación y eliminación de sus datos personales en cualquier momento.",
        explanation: "Se informa correctamente el derecho ARCO (Acceso, Rectificación, Cancelación, Oposición). Cumple estándar vigente.",
        law: "Ley 19.628, Art. 12",
      },
    ],

    dataSharing: [
      {
        id: "ds1",
        icon: "📍",
        title: "Datos de ubicación",
        description: "Zona de residencia aproximada, no GPS exacto",
        benefit: "2% descuento seguros",
        hasExtra: true,
      },
      {
        id: "ds2",
        icon: "🛒",
        title: "Hábitos de compra",
        description: "Categorías de gasto mensual anonimizadas",
        benefit: "$500 cashback/mes",
        hasExtra: true,
      },
      {
        id: "ds3",
        icon: "💳",
        title: "Historial crediticio",
        description: "Solo para ofertas de productos financieros",
        benefit: "Tasa preferencial",
        hasExtra: true,
      },
      {
        id: "ds4",
        icon: "🚫",
        title: "Nada, gracias",
        description: "Uso solo lo necesario para el servicio",
        benefit: "Sin beneficio extra",
        hasExtra: false,
      },
    ],

    laws: [
      { law: "Ley 19.628",    title: "Protección de la Vida Privada",     complies: false, detail: "3 cláusulas exceden lo permitido (finalidad, cesión, retención)" },
      { law: "Ley 21.719",    title: "Nueva Ley de Datos Personales",     complies: false, detail: "Transferencia internacional sin salvaguardas adecuadas" },
      { law: "Ley 21.398",    title: "Ley Pro Consumidor",                 complies: true,  detail: "Canal de reclamo ante SERNAC correctamente informado" },
      { law: "Circular CMF",  title: "Normativa CMF Datos Financieros",   complies: true,  detail: "Derecho ARCO informado, plazo de respuesta cumple" },
      { law: "Ley 20.009",    title: "Uso Fraudulento Tarjetas",           complies: true,  detail: "Protocolo de bloqueo y notificación incluido" },
    ],

    emailAction: {
      to: "privacidad@bancochile.cl",
      entityName: "Banco de Chile",
      subject: "Ejercicio de derechos ARCO y solicitud de aclaración contractual — Ley 19.628",
      body: `Estimado equipo de Privacidad de Banco de Chile,

Por medio de la presente, en virtud de lo establecido en la Ley N°19.628 sobre Protección de la Vida Privada y la próxima Ley N°21.719, ejerzo mis derechos de titular de datos personales y solicito formalmente:

1. DERECHO DE ACCESO: Listado completo de mis datos personales que mantienen en su poder, incluyendo datos biométricos, historial de transacciones y datos de terceros con quienes han sido compartidos.

2. ACLARACIÓN DE FINALIDAD: Identificación específica de las empresas del "grupo y aliados comerciales" con quienes comparten mi información (cláusula 5.2 del contrato).

3. PLAZO DE RETENCIÓN: Información precisa sobre el tiempo de retención de cada categoría de dato personal tratado, en cumplimiento del Art. 11 de la Ley 19.628.

4. RECTIFICACIÓN DE CONSENTIMIENTO: Solicito que se genere un mecanismo de consentimiento específico, revocable e independiente para cada finalidad de tratamiento.

En caso de no recibir respuesta dentro del plazo legal de 10 días hábiles, me reservo el derecho de presentar reclamo ante la CMF y SERNAC.

Atentamente,
[Tu nombre]
[RUT]
[Teléfono de contacto]`,
    },
  };

  res.json(result);
}
