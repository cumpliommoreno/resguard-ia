import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, type File } from "formidable";
import { readFileSync } from "fs";
import { put } from "@vercel/blob";
import { supabase } from "@/lib/supabase";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ id: string } | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Error parsing form" });

    const email          = Array.isArray(fields.email)           ? fields.email[0]           : fields.email;
    const titularNombre  = Array.isArray(fields.titular_nombre)  ? fields.titular_nombre[0]  : fields.titular_nombre;
    const titularRut     = Array.isArray(fields.titular_rut)     ? fields.titular_rut[0]     : fields.titular_rut;
    const contract       = Array.isArray(files.contract) ? files.contract[0] : files.contract as unknown as File;

    if (!email || !contract) return res.status(400).json({ error: "email and contract are required" });

    // Subir a Vercel Blob
    const buffer = readFileSync(contract.filepath);
    const blob = await put(contract.originalFilename ?? "contract.pdf", buffer, {
      access: "private",
      contentType: contract.mimetype ?? "application/pdf",
    });

    // Crear registro en Supabase
    const { data, error } = await supabase
      .from("analyses")
      .insert({
        email,
        titular_nombre: titularNombre ?? null,
        titular_rut:    titularRut    ?? null,
        file_url:  blob.url,
        file_name: contract.originalFilename ?? "contract.pdf",
        status:    "pending",
      })
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ id: data.id });
  });
}
