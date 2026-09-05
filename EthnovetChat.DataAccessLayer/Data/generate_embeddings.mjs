import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read dataset
const datasetPath = path.join(__dirname, 'ethnovet_dataset.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

// Try reading API key from appsettings.Development.json
let apiKey = process.env.GEMINI_API_KEY || '';
try {
  const devSettingsPath = path.join(__dirname, '..', '..', 'EthnovetChat.ServiceLayer', 'appsettings.Development.json');
  if (fs.existsSync(devSettingsPath)) {
    const devJson = JSON.parse(fs.readFileSync(devSettingsPath, 'utf-8'));
    if (devJson.Gemini && devJson.Gemini.ApiKey && !devJson.Gemini.ApiKey.includes('YOUR_')) {
      apiKey = devJson.Gemini.ApiKey;
    }
  }
} catch (e) {
  console.warn('Could not read API key from dev settings:', e.message);
}

console.log(`Loaded ${dataset.length} remedies from dataset.`);

async function getEmbedding(text, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`;
  const payload = {
    model: 'models/gemini-embedding-001',
    content: {
      parts: [{ text: text.slice(0, 2048) }]
    },
    outputDimensionality: 768
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding API error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  return json.embedding.values;
}

// Deterministic semantic fallback embedding if API key is rate-limited
function generateDeterministicEmbedding(text, dimensions = 768) {
  const vector = new Float32Array(dimensions);
  const words = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1.0;
  }

  // Normalize vector to unit length
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1.0;
  return Array.from(vector.map(v => v / norm));
}

async function main() {
  const output = [];
  let apiSuccessCount = 0;
  let fallbackCount = 0;

  console.log(`Starting vector embedding calculation for ${dataset.length} remedies...`);

  for (let i = 0; i < dataset.length; i++) {
    const r = dataset[i];
    const textChunk = `Disease: ${r.disease}. Target Animal: ${r.animal}. Symptoms: ${r.symptoms}. Herbal Ingredients: ${r.ingredients}. Preparation and Treatment: ${r.treatment}`;
    
    let vector = null;
    if (apiKey) {
      try {
        vector = await getEmbedding(textChunk, apiKey);
        apiSuccessCount++;
        // Small delay to be courteous to free-tier rate limits
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (err) {
        console.warn(`[Item ${r.id}: ${r.disease}] API failed (${err.message.slice(0, 60)}), using semantic projection.`);
        vector = generateDeterministicEmbedding(textChunk);
        fallbackCount++;
      }
    } else {
      vector = generateDeterministicEmbedding(textChunk);
      fallbackCount++;
    }

    output.push({
      id: r.id,
      disease: r.disease,
      animal: r.animal,
      symptoms: r.symptoms,
      ingredients: r.ingredients,
      treatment: r.treatment,
      searchChunk: textChunk,
      embedding: vector
    });

    if ((i + 1) % 10 === 0 || i === dataset.length - 1) {
      console.log(`Processed ${i + 1}/${dataset.length} remedies...`);
    }
  }

  const outputPath = path.join(__dirname, 'ethnovet_embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  const stats = fs.statSync(outputPath);

  console.log('\n============================================================');
  console.log(`✅ Embedding index created successfully: ${outputPath}`);
  console.log(`Total vectors: ${output.length} (API: ${apiSuccessCount}, Fallback: ${fallbackCount})`);
  console.log(`Vector Dimension: ${output[0].embedding.length}`);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log('============================================================\n');
}

main().catch(console.error);
