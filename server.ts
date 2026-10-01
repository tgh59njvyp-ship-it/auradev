import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { auraStorage } from './server/storage.js';
import { providerRegistry } from './server/adapters/index.js';
import { sanitizeLog } from './server/security.js';
import { ProviderId } from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

const app = express();
app.use(express.json({ limit: '15mb' }));

// Helper to get userId from header or default
function getUserId(req: Request): string {
  const customId = req.headers['x-user-id'] as string;
  return (customId && customId.trim()) || 'aura_developer_default';
}

// -------------------------------------------------------------
// API: Settings & User Profile
// -------------------------------------------------------------
app.get('/api/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const settings = auraStorage.getSettings(userId);
  res.json({
    userId,
    settings,
    environmentKeysConfigured: {
      gemini: !!process.env.GEMINI_API_KEY
    }
  });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const updated = auraStorage.updateSettings(userId, req.body);
  res.json({ success: true, settings: updated });
});

// -------------------------------------------------------------
// API: Keys Management (BYOK)
// -------------------------------------------------------------
app.get('/api/keys', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const keys = auraStorage.getMaskedKeys(userId);
  res.json({ keys });
});

app.post('/api/keys', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { providerId, apiKey, customBaseUrl, customProviderName, testImmediately } = req.body;

  if (!providerId || !apiKey) {
    return res.status(400).json({ error: 'providerId and apiKey are required' });
  }

  const cleanKey = apiKey.trim();
  let status: 'connected' | 'not_connected' | 'error' = 'not_connected';
  let errorMessage: string | undefined;

  if (testImmediately) {
    const adapter = providerRegistry.getAdapter(providerId);
    const valResult = await adapter.validateApiKey(cleanKey, customBaseUrl);
    if (valResult.valid) {
      status = 'connected';
    } else {
      status = 'error';
      errorMessage = valResult.message || 'Connection test failed';
    }
  }

  auraStorage.setApiKey(
    userId,
    providerId as ProviderId,
    cleanKey,
    status,
    customBaseUrl,
    customProviderName,
    errorMessage
  );

  const updatedKeys = auraStorage.getMaskedKeys(userId);
  res.json({
    success: true,
    status,
    errorMessage,
    keys: updatedKeys
  });
});

app.post('/api/keys/test', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { providerId, tempApiKey, customBaseUrl } = req.body;

  let keyToTest = tempApiKey;
  let baseUrl = customBaseUrl;

  if (!keyToTest) {
    const existing = auraStorage.getRawApiKey(userId, providerId as ProviderId);
    if (!existing || !existing.apiKey) {
      return res.status(400).json({ error: 'No API key provided or found to test' });
    }
    keyToTest = existing.apiKey;
    if (!baseUrl) baseUrl = existing.customBaseUrl;
  }

  const adapter = providerRegistry.getAdapter(providerId);
  const result = await adapter.validateApiKey(keyToTest, baseUrl);

  // Update status if it was an existing saved key
  if (!tempApiKey) {
    auraStorage.setApiKey(
      userId,
      providerId as ProviderId,
      keyToTest,
      result.valid ? 'connected' : 'error',
      baseUrl,
      undefined,
      result.valid ? undefined : result.message
    );
  }

  res.json({
    success: result.valid,
    status: result.valid ? 'connected' : 'error',
    message: result.valid ? '✓ Connected successfully' : `✕ Connection Failed: ${result.message || 'Invalid key'}`
  });
});

app.delete('/api/keys/:providerId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { providerId } = req.params;
  auraStorage.removeApiKey(userId, providerId as ProviderId);
  res.json({ success: true, keys: auraStorage.getMaskedKeys(userId) });
});

// -------------------------------------------------------------
// API: Custom Models & Model Registry
// -------------------------------------------------------------
app.get('/api/models', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const models = auraStorage.getModels(userId);
  res.json({ models });
});

app.post('/api/models', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const modelData = req.body;
  if (!modelData.providerId || !modelData.modelName || !modelData.modelId) {
    return res.status(400).json({ error: 'providerId, modelName, and modelId are required' });
  }

  const saved = auraStorage.saveModel(userId, modelData);
  res.json({ success: true, model: saved, models: auraStorage.getModels(userId) });
});

app.post('/api/models/test', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { providerId, modelId, customBaseUrl } = req.body;

  if (!providerId || !modelId) {
    return res.status(400).json({ error: 'providerId and modelId are required' });
  }

  const keyConfig = auraStorage.getRawApiKey(userId, providerId as ProviderId);
  // Check if system environment fallback exists for demo/first-run
  let apiKey = keyConfig?.apiKey;
  if (!apiKey && providerId === 'gemini' && process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({
      available: false,
      message: 'No API key configured for this provider. Please connect your API key first in API Keys.'
    });
  }

  const adapter = providerRegistry.getAdapter(providerId);
  const result = await adapter.testModel(apiKey, modelId, customBaseUrl || keyConfig?.customBaseUrl);
  res.json(result);
});

app.post('/api/models/:modelId/fixed', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { modelId } = req.params;
  const ok = auraStorage.setFixedModel(userId, modelId);
  res.json({ success: ok, models: auraStorage.getModels(userId) });
});

app.delete('/api/models/:modelId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { modelId } = req.params;
  const ok = auraStorage.deleteModel(userId, modelId);
  res.json({ success: ok, models: auraStorage.getModels(userId) });
});

app.get('/api/models/discover/:providerId', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { providerId } = req.params;
  const keyConfig = auraStorage.getRawApiKey(userId, providerId as ProviderId);
  let apiKey = keyConfig?.apiKey;
  if (!apiKey && providerId === 'gemini' && process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'Please connect your API key first to discover models from API.' });
  }

  const adapter = providerRegistry.getAdapter(providerId);
  if (!adapter.listModels) {
    return res.json({ models: [] });
  }

  try {
    const list = await adapter.listModels(apiKey, keyConfig?.customBaseUrl);
    res.json({ models: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to discover models: ' + sanitizeLog(err?.message || '') });
  }
});

// Import/Export Models JSON (never includes API key)
app.get('/api/models/export', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const models = auraStorage.getModels(userId);
  const sanitized = models.map(m => ({
    modelName: m.modelName,
    modelId: m.modelId,
    providerId: m.providerId,
    description: m.description,
    contextLength: m.contextLength,
    inputPrice: m.inputPrice,
    outputPrice: m.outputPrice,
    capabilities: m.capabilities,
    isFixed: m.isFixed,
    customBaseUrl: m.customBaseUrl
  }));
  res.setHeader('Content-Disposition', 'attachment; filename="aura-models.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(sanitized, null, 2));
});

app.post('/api/models/import', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Expected an array of models' });
  }

  for (const item of items) {
    if (item.modelName && item.modelId && item.providerId) {
      auraStorage.saveModel(userId, {
        providerId: item.providerId,
        modelName: item.modelName,
        modelId: item.modelId,
        description: item.description,
        contextLength: item.contextLength,
        inputPrice: item.inputPrice,
        outputPrice: item.outputPrice,
        capabilities: item.capabilities || { text: true, vision: false, image: false, audio: false, toolCalling: false, structuredOutput: false },
        isFixed: false,
        customBaseUrl: item.customBaseUrl
      });
    }
  }

  res.json({ success: true, models: auraStorage.getModels(userId) });
});

// -------------------------------------------------------------
// API: Streaming AI Chat (BYOK & Exact Model ID)
// -------------------------------------------------------------
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { providerId, modelId, modelName, messages, systemInstruction, temperature, isDemoMode } = req.body;

  if (!providerId || !modelId || !messages) {
    return res.status(400).json({ error: 'providerId, modelId, and messages are required' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Handle Demo Mode explicitly
  if (isDemoMode) {
    const demoReply = `[DEMO MODE RESPONSE]
こんにちは！現在 **DEMO MODE** で動作しています。実際の外部AIプロバイダーへのリクエストやAPIキーの消費は行われていません。

・選択プロバイダー: ${providerId}
・指定Model ID: \`${modelId}\` (UI表示名: ${modelName || modelId})

実際のAI APIを利用するには、上部ナビゲーションの「API Keys」からご自身のAPIキーを登録して、Demo ModeをOFFにしてください。`;

    for (let i = 0; i < demoReply.length; i += 4) {
      res.write(`data: ${JSON.stringify({ chunk: demoReply.slice(i, i + 4) })}\n\n`);
      await new Promise(r => setTimeout(r, 20));
    }

    res.write(`data: ${JSON.stringify({ done: true, tokens: { input: 20, output: 80, total: 100 } })}\n\n`);
    res.end();
    return;
  }

  // Get raw API key
  const keyConfig = auraStorage.getRawApiKey(userId, providerId as ProviderId);
  let apiKey = keyConfig?.apiKey;

  if (!apiKey && providerId === 'gemini' && process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: `No API key configured for provider "${providerId}". Please add your API key in the "API Keys" page.` })}\n\n`);
    res.end();
    return;
  }

  const adapter = providerRegistry.getAdapter(providerId);

  try {
    const response = await adapter.streamText(
      apiKey,
      {
        modelId,
        messages,
        systemInstruction,
        temperature: temperature ?? 0.7
      },
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      keyConfig?.customBaseUrl
    );

    // Record Usage
    auraStorage.addUsageLog(userId, {
      providerId: providerId as ProviderId,
      modelId,
      modelName: modelName || modelId,
      action: 'chat',
      inputTokens: response.inputTokens || 0,
      outputTokens: response.outputTokens || 0,
      totalTokens: response.totalTokens || 0,
      estimatedCost: 0.0002,
      status: 'success'
    });

    res.write(`data: ${JSON.stringify({ done: true, tokens: { input: response.inputTokens, output: response.outputTokens, total: response.totalTokens } })}\n\n`);
    res.end();
  } catch (err: any) {
    const safeError = sanitizeLog(err?.message || 'AI Provider call failed');
    res.write(`data: ${JSON.stringify({ error: safeError })}\n\n`);
    res.end();
  }
});

// -------------------------------------------------------------
// API: Build Mode (AI Project Generation)
// -------------------------------------------------------------
app.post('/api/build/generate', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { prompt, templateType, providerId, modelId, isDemoMode } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (isDemoMode) {
    // Generate instant rich demo project
    const demoFiles = [
      {
        path: 'index.html',
        language: 'html',
        updatedAt: new Date().toISOString(),
        content: `<!DOCTYPE html>
<html lang="ja" class="dark">
<head>
  <meta charset="UTF-8">
  <title>${prompt.slice(0, 30)} - AURA Generated</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-2xl mx-auto space-y-6">
    <header class="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">${prompt.slice(0, 25)}</h1>
        <p class="text-xs text-slate-400 mt-1">Generated by AURA DEV (Demo Mode)</p>
      </div>
      <span class="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full border border-indigo-500/30">
        Demo Build
      </span>
    </header>
    <main class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <p class="text-slate-300">指示「${prompt}」に基づき生成されたプロトタイプです。</p>
      <div class="p-4 bg-slate-800 rounded-xl">
        <label class="block text-xs font-medium text-slate-400 mb-2">インタラクティブ入力</label>
        <input type="text" id="demoInput" placeholder="入力してみてください..." class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white" />
      </div>
      <button onclick="alert('Demo: ' + document.getElementById('demoInput').value)" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-sm transition">
        実行テスト
      </button>
    </main>
  </div>
</body>
</html>`
      },
      {
        path: 'README.md',
        language: 'markdown',
        updatedAt: new Date().toISOString(),
        content: `# ${prompt}\n\nGenerated with AURA DEV Build Mode.\n\n## Instructions\nThis is a generated app prototype based on: "${prompt}".`
      }
    ];

    const project = auraStorage.saveProject(userId, {
      name: prompt.slice(0, 30),
      description: prompt,
      templateType: templateType || 'web',
      files: demoFiles,
      activeFilePath: 'index.html'
    });

    return res.json({ success: true, project });
  }

  // Real AI generation using selected Provider & Model ID
  const keyConfig = auraStorage.getRawApiKey(userId, providerId as ProviderId);
  let apiKey = keyConfig?.apiKey;
  if (!apiKey && providerId === 'gemini' && process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ error: `No API key for provider ${providerId}. Connect your key in API Keys.` });
  }

  const adapter = providerRegistry.getAdapter(providerId);

  const systemInstruction = `You are AURA DEV's Autonomous Full-Stack Project Architect.
The user wants to generate a complete, working web application based on their prompt.
Output a JSON array of files. Each object must have:
- "path": string (e.g., "index.html", "src/app.js", "styles.css", "package.json", "README.md")
- "content": string (complete, production-grade, functional code with no placeholders or ellipses)
- "language": string ("html" | "javascript" | "typescript" | "css" | "json" | "markdown")

Always include a complete, standalone "index.html" that includes Tailwind CSS via CDN (<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>) so that it renders immediately in our live sandboxed preview iframe!
Return ONLY valid JSON array with no extra markdown formatting, backticks, or commentary.`;

  try {
    const aiResp = await adapter.generateText(
      apiKey,
      {
        modelId,
        systemInstruction,
        messages: [{ role: 'user', content: `Create application: ${prompt}` }],
        temperature: 0.2
      },
      keyConfig?.customBaseUrl
    );

    let raw = aiResp.content.trim();
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```\n?/, '').replace(/```$/, '').trim();
    }

    let files: any[] = [];
    try {
      files = JSON.parse(raw);
    } catch {
      // Fallback if parsing fails
      files = [
        {
          path: 'index.html',
          language: 'html',
          content: raw.includes('<html') ? raw : `<!DOCTYPE html><html><body><pre>${raw}</pre></body></html>`
        }
      ];
    }

    const formattedFiles = files.map((f: any) => ({
      path: f.path || 'index.html',
      language: f.language || 'html',
      content: f.content || '',
      updatedAt: new Date().toISOString()
    }));

    const project = auraStorage.saveProject(userId, {
      name: prompt.slice(0, 30),
      description: prompt,
      templateType: templateType || 'web',
      files: formattedFiles,
      activeFilePath: formattedFiles[0]?.path || 'index.html'
    });

    auraStorage.addUsageLog(userId, {
      providerId: providerId as ProviderId,
      modelId,
      modelName: modelId,
      action: 'build',
      inputTokens: aiResp.inputTokens || 0,
      outputTokens: aiResp.outputTokens || 0,
      totalTokens: aiResp.totalTokens || 0,
      estimatedCost: 0.001,
      status: 'success'
    });

    res.json({ success: true, project });
  } catch (err: any) {
    const safeMsg = sanitizeLog(err?.message || 'Failed to generate project');
    res.status(500).json({ error: safeMsg });
  }
});

// -------------------------------------------------------------
// API: AI Code Editing & Diff Generation
// -------------------------------------------------------------
app.post('/api/edit/propose', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { projectId, filePath, instruction, providerId, modelId, isDemoMode } = req.body;

  const project = auraStorage.getProject(userId, projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const file = project.files.find(f => f.path === filePath);
  if (!file) return res.status(404).json({ error: 'File not found in project' });

  if (isDemoMode) {
    const proposed = file.content + `\n<!-- Modified by AURA DEV (Demo): ${instruction} -->`;
    return res.json({
      originalContent: file.content,
      proposedContent: proposed,
      summary: `Demo edit: Added modification comment for "${instruction}"`
    });
  }

  const keyConfig = auraStorage.getRawApiKey(userId, providerId as ProviderId);
  let apiKey = keyConfig?.apiKey;
  if (!apiKey && providerId === 'gemini' && process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'No API key configured for provider' });
  }

  const adapter = providerRegistry.getAdapter(providerId);

  const prompt = `You are AURA DEV's Code Editor.
File Path: "${file.path}"
Language: "${file.language}"
Current Content:
\`\`\`
${file.content}
\`\`\`

User Instruction: "${instruction}"

Output a JSON object with:
- "summary": string (A concise summary of the changes made)
- "proposedContent": string (The complete, entire updated file content with the user's modifications accurately applied. No placeholders or comments like '// rest of code' - provide the full code)

Return ONLY valid JSON.`;

  try {
    const aiResp = await adapter.generateText(
      apiKey,
      {
        modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      },
      keyConfig?.customBaseUrl
    );

    let raw = aiResp.content.trim();
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```\n?/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(raw);
    res.json({
      originalContent: file.content,
      proposedContent: parsed.proposedContent || file.content,
      summary: parsed.summary || 'Code modifications proposed'
    });
  } catch (err: any) {
    res.status(500).json({ error: sanitizeLog(err?.message || 'Code edit failed') });
  }
});

// -------------------------------------------------------------
// API: Projects Management
// -------------------------------------------------------------
app.get('/api/projects', (req: Request, res: Response) => {
  const userId = getUserId(req);
  res.json({ projects: auraStorage.getProjects(userId) });
});

app.get('/api/projects/:projectId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const project = auraStorage.getProject(userId, req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const project = auraStorage.saveProject(userId, req.body);
  res.json({ success: true, project });
});

app.put('/api/projects/:projectId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const project = auraStorage.saveProject(userId, { id: req.params.projectId, ...req.body });
  res.json({ success: true, project });
});

app.delete('/api/projects/:projectId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const ok = auraStorage.deleteProject(userId, req.params.projectId);
  res.json({ success: ok, projects: auraStorage.getProjects(userId) });
});

// -------------------------------------------------------------
// API: Chats Management
// -------------------------------------------------------------
app.get('/api/chats', (req: Request, res: Response) => {
  const userId = getUserId(req);
  res.json({ chats: auraStorage.getChats(userId) });
});

app.post('/api/chats', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const chat = auraStorage.saveChat(userId, req.body);
  res.json({ success: true, chat });
});

app.delete('/api/chats/:chatId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const ok = auraStorage.deleteChat(userId, req.params.chatId);
  res.json({ success: ok, chats: auraStorage.getChats(userId) });
});

// -------------------------------------------------------------
// API: Agents Management
// -------------------------------------------------------------
app.get('/api/agents', (req: Request, res: Response) => {
  const userId = getUserId(req);
  res.json({ agents: auraStorage.getAgents(userId) });
});

app.post('/api/agents', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const agent = auraStorage.saveAgent(userId, req.body);
  res.json({ success: true, agent });
});

app.delete('/api/agents/:agentId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const ok = auraStorage.deleteAgent(userId, req.params.agentId);
  res.json({ success: ok, agents: auraStorage.getAgents(userId) });
});

// -------------------------------------------------------------
// API: Usage Analytics
// -------------------------------------------------------------
app.get('/api/usage', (req: Request, res: Response) => {
  const userId = getUserId(req);
  res.json({ usage: auraStorage.getUsage(userId) });
});

// -------------------------------------------------------------
// Frontend Integration (Vite in Dev, Dist in Prod)
// -------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AURA DEV Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
