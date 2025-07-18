import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pdfParse from "npm:pdf-parse";
import mammoth from "npm:mammoth";
import * as XLSX from "npm:xlsx";
import Tesseract from "npm:tesseract.js";
import { Buffer } from "node:buffer";

serve(async (req) => {
  const payload = await req.json();
  const record = payload?.record;

  if (!record || record.bucket_id !== 'knowledge_base') {
    return new Response('Invalid payload', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    return new Response('Server misconfigured', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { authorization: `Bearer ${serviceKey}` } },
  });

  const { data: file, error } = await supabase.storage
    .from(record.bucket_id)
    .download(record.name);

  if (error || !file) {
    console.error('Download error', error);
    return new Response('Download failed', { status: 500 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = record.name.split('.').pop()?.toLowerCase() || '';
  let text = '';

  try {
    switch (ext) {
      case 'pdf':
        text = (await pdfParse(buffer)).text;
        break;
      case 'docx':
        text = (await mammoth.extractRawText({ buffer })).value;
        break;
      case 'xlsx':
        const wb = XLSX.read(buffer, { type: 'buffer' });
        text = wb.SheetNames
          .map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n]))
          .join('\n');
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
        const result = await Tesseract.recognize(buffer, 'eng');
        text = result.data.text;
        break;
    }
  } catch (e) {
    console.error('Parse error', e);
  }

  const { data: urlData } = supabase.storage
    .from(record.bucket_id)
    .getPublicUrl(record.name);

  const { error: insertError } = await supabase
    .from('knowledge_base_entries')
    .insert({
      file_name: record.name.split('/').pop(),
      file_url: urlData.publicUrl,
      file_type: ext,
      extracted_text: text,
    });

  if (insertError) {
    console.error('DB insert error', insertError);
  }

  return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
});
