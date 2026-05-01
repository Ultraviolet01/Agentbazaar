'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Rocket, 
  Info, 
  Loader2, 
  AlertTriangle,
  Check,
  ArrowLeft,
  Plus,
  X,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { encryptCredentials } from '@/lib/tee-crypto';

const CATEGORIES = [
  { value: 'security', label: '🛡️ Security & Safety', color: '#22c55e' },
  { value: 'content', label: '🎨 Content & Creative', color: '#f97316' },
  { value: 'monitoring', label: '📡 Monitoring & Alerts', color: '#3b82f6' },
  { value: 'analytics', label: '📊 Analytics & Insights', color: '#8b5cf6' },
  { value: 'automation', label: '🤖 Automation & Tasks', color: '#ec4899' },
];

const MODEL_PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'custom', label: 'Custom Model' },
  { value: 'multiple', label: 'Multiple Models' },
];

export default function DeployAgentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [teePublicKey, setTeePublicKey] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    longDescription: '',
    category: '',
    tags: [] as string[],
    
    // Technical
    apiEndpoint: '',
    webhookUrl: '',
    modelProvider: '',
    modelName: '',
    
    // Pricing
    pricePerRun: '',
    setupFee: '0',
    
    // Branding
    icon: '🤖',
    color: '#f97316',
    
    // Documentation
    readme: '',
    exampleInput: '',
    exampleOutput: '',
    
    // Input/Output Schema
    inputFields: [{ name: '', type: 'text', required: true, description: '' }],
    outputFields: [{ name: '', type: 'text', description: '' }],
    
    // Credentials
    apiKeys: {
      openai_api_key: '',
      anthropic_api_key: '',
      custom_api_key: '',
    } as Record<string, string>,
  });

  // Tag input
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApiKeyChange = (key: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      apiKeys: { ...prev.apiKeys, [key]: value } 
    }));
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      handleInputChange('tags', [...formData.tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    handleInputChange('tags', formData.tags.filter(t => t !== tag));
  };

  const addInputField = () => {
    handleInputChange('inputFields', [
      ...formData.inputFields,
      { name: '', type: 'text', required: false, description: '' }
    ]);
  };

  const removeInputField = (index: number) => {
    handleInputChange(
      'inputFields',
      formData.inputFields.filter((_, i) => i !== index)
    );
  };

  const updateInputField = (index: number, field: string, value: any) => {
    const updated = [...formData.inputFields];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange('inputFields', updated);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.pricePerRun || parseFloat(formData.pricePerRun) <= 0) {
        throw new Error('Please set a valid price per run');
      }

      // Create input/output schemas
      const inputSchema = {
        type: 'object',
        properties: formData.inputFields.reduce((acc, field) => ({
          ...acc,
          [field.name]: {
            type: field.type,
            description: field.description
          }
        }), {}),
        required: formData.inputFields
          .filter(f => f.required)
          .map(f => f.name)
      };

      const outputSchema = {
        type: 'object',
        properties: formData.outputFields.reduce((acc, field) => ({
          ...acc,
          [field.name]: {
            type: field.type,
            description: field.description
          }
        }), {})
      };

      // Create examples
      const examples = {
        input: formData.exampleInput ? JSON.parse(formData.exampleInput) : {},
        output: formData.exampleOutput ? JSON.parse(formData.exampleOutput) : {}
      };

      // Handle credentials encryption if needed
      let encryptedCredentials = null;
      let credentialSchema = null;
      
      const requiresKeys = formData.modelProvider !== 'custom' || formData.apiKeys.custom_api_key;
      
      if (requiresKeys) {
        // Fetch TEE public key if we don't have it
        let pubKey = teePublicKey;
        if (!pubKey) {
          const keyRes = await fetch('/api/tee/public-key');
          if (!keyRes.ok) throw new Error('Failed to securely initialize credential store');
          const keyData = await keyRes.json();
          pubKey = keyData.publicKey;
          setTeePublicKey(pubKey);
        }
        
        // Build the credentials payload based on provider
        const credsToEncrypt: any = { provider: formData.modelProvider };
        if (formData.modelProvider === 'openai') credsToEncrypt.apiKey = formData.apiKeys.openai_api_key;
        if (formData.modelProvider === 'anthropic') credsToEncrypt.apiKey = formData.apiKeys.anthropic_api_key;
        if (formData.modelProvider === 'custom') credsToEncrypt.apiKey = formData.apiKeys.custom_api_key;
        
        // Only encrypt if a key was actually provided
        if (credsToEncrypt.apiKey) {
          encryptedCredentials = await encryptCredentials(pubKey, credsToEncrypt);
          credentialSchema = { provider: formData.modelProvider, fields: ['apiKey'] };
        }
      }

      const response = await fetch('/api/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pricePerRun: parseFloat(formData.pricePerRun),
          setupFee: parseFloat(formData.setupFee),
          inputSchema,
          outputSchema,
          examples,
          encryptedCredentials,
          credentialSchema
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy agent');
      }

      // Success!
      router.push(`/agents/deployed/${data.agent.slug}?deployed=true`);
    } catch (err: any) {
      setError(err.message || 'Failed to deploy agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deploy Your Agent</h1>
            <p className="text-sm text-gray-600">
              Add your AI agent to the marketplace and earn revenue
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > step ? 'bg-orange-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Basic Info</span>
          <span>Configuration</span>
          <span>Credentials</span>
          <span>Review</span>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Revenue Share:</strong> You earn 90% of all revenue from your agent. 
          AgentBazaar takes 10% platform fee. Payouts in OG tokens monthly.
        </AlertDescription>
      </Alert>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <Card className="bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Basic Information
          </h2>

          <div className="space-y-6">
            
            {/* Agent Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Agent Name *
              </Label>
              <Input
                id="name"
                placeholder="ScamSniff"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose a unique, memorable name for your agent
              </p>
            </div>

            {/* Short Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Short Description *
              </Label>
              <Textarea
                id="description"
                placeholder="AI-powered scam detector with 8-layer evidence pipeline"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="mt-1"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/160 characters
              </p>
            </div>

            {/* Long Description */}
            <div>
              <Label htmlFor="longDescription" className="text-sm font-medium text-gray-700">
                Long Description *
              </Label>
              <Textarea
                id="longDescription"
                placeholder="Detailed description of what your agent does, how it works, and what problems it solves..."
                value={formData.longDescription}
                onChange={(e) => handleInputChange('longDescription', e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Category *
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleInputChange('category', cat.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.category === cat.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base font-semibold">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Tags
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="defi, nft, social..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button onClick={addTag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="icon" className="text-sm font-medium text-gray-700">
                  Icon (Emoji)
                </Label>
                <Input
                  id="icon"
                  placeholder="🤖"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="mt-1 text-4xl text-center"
                  maxLength={2}
                />
              </div>
              
              <div>
                <Label htmlFor="color" className="text-sm font-medium text-gray-700">
                  Brand Color
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="#f97316"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!formData.name || !formData.description || !formData.category}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Next: Configuration
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Configuration */}
      {currentStep === 2 && (
        <Card className="bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Technical Configuration
          </h2>

          <div className="space-y-6">
            
            {/* API Endpoint */}
            <div>
              <Label htmlFor="apiEndpoint" className="text-sm font-medium text-gray-700">
                API Endpoint
              </Label>
              <Input
                id="apiEndpoint"
                placeholder="https://api.youragent.com/run"
                value={formData.apiEndpoint}
                onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                POST endpoint where AgentBazaar will send agent run requests
              </p>
            </div>

            {/* Webhook URL */}
            <div>
              <Label htmlFor="webhookUrl" className="text-sm font-medium text-gray-700">
                Webhook URL (Optional)
              </Label>
              <Input
                id="webhookUrl"
                placeholder="https://api.youragent.com/webhook"
                value={formData.webhookUrl}
                onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send status updates to this URL
              </p>
            </div>

            {/* Model Provider */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                AI Model Provider *
              </Label>
              <select
                value={formData.modelProvider}
                onChange={(e) => handleInputChange('modelProvider', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select provider...</option>
                {MODEL_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Name */}
            <div>
              <Label htmlFor="modelName" className="text-sm font-medium text-gray-700">
                Model Name
              </Label>
              <Input
                id="modelName"
                placeholder="claude-sonnet-4-6"
                value={formData.modelName}
                onChange={(e) => handleInputChange('modelName', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="pricePerRun" className="text-sm font-medium text-gray-700">
                  Price Per Run (CRD) *
                </Label>
                <Input
                  id="pricePerRun"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1.0"
                  value={formData.pricePerRun}
                  onChange={(e) => handleInputChange('pricePerRun', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You earn: {formData.pricePerRun ? (parseFloat(formData.pricePerRun) * 0.9).toFixed(2) : '0.00'} CRD
                </p>
              </div>
              
              <div>
                <Label htmlFor="setupFee" className="text-sm font-medium text-gray-700">
                  Setup Fee (CRD)
                </Label>
                <Input
                  id="setupFee"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={formData.setupFee}
                  onChange={(e) => handleInputChange('setupFee', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Input Fields Schema */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-700">
                  Input Fields *
                </Label>
                <Button onClick={addInputField} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Field
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.inputFields.map((field, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                    <Input
                      placeholder="Field name"
                      value={field.name}
                      onChange={(e) => updateInputField(index, 'name', e.target.value)}
                      className="col-span-3"
                    />
                    
                    <select
                      value={field.type}
                      onChange={(e) => updateInputField(index, 'type', e.target.value)}
                      className="col-span-2 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                    
                    <Input
                      placeholder="Description"
                      value={field.description}
                      onChange={(e) => updateInputField(index, 'description', e.target.value)}
                      className="col-span-5"
                    />
                    
                    <label className="col-span-1 flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateInputField(index, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    
                    <button
                      onClick={() => removeInputField(index)}
                      className="col-span-1 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Example Input/Output */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="exampleInput" className="text-sm font-medium text-gray-700">
                  Example Input (JSON)
                </Label>
                <Textarea
                  id="exampleInput"
                  placeholder='{"url": "https://example.com"}'
                  value={formData.exampleInput}
                  onChange={(e) => handleInputChange('exampleInput', e.target.value)}
                  rows={4}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="exampleOutput" className="text-sm font-medium text-gray-700">
                  Example Output (JSON)
                </Label>
                <Textarea
                  id="exampleOutput"
                  placeholder='{"risk_score": 85, "verdict": "high risk"}'
                  value={formData.exampleOutput}
                  onChange={(e) => handleInputChange('exampleOutput', e.target.value)}
                  rows={4}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>

            {/* Documentation */}
            <div>
              <Label htmlFor="readme" className="text-sm font-medium text-gray-700">
                Documentation (Markdown)
              </Label>
              <Textarea
                id="readme"
                placeholder="# How to use this agent&#10;&#10;This agent analyzes..."
                value={formData.readme}
                onChange={(e) => handleInputChange('readme', e.target.value)}
                rows={8}
                className="mt-1 font-mono text-sm"
              />
            </div>

          </div>

          <div className="flex justify-between mt-8">
            <Button
              onClick={() => setCurrentStep(1)}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={!formData.apiEndpoint || !formData.modelProvider || !formData.pricePerRun}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Next: Credentials
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: API Credentials */}
      {currentStep === 3 && (
        <Card className="bg-white border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              API Credentials (TEE Secured)
            </h2>
          </div>

          <Alert className="mb-6 bg-green-50 border-green-200">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-sm text-green-900">
              <strong>Bank-grade Security:</strong> Your API keys are encrypted locally in your browser 
              using RSA-OAEP. They are stored on the 0G decentralized storage network and are <strong>only decrypted 
              inside our hardware Trusted Execution Environment (TEE)</strong> when your agent runs. AgentBazaar 
              never sees or stores your plaintext keys.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {formData.modelProvider === 'openai' && (
              <div>
                <Label htmlFor="openai_api_key" className="text-sm font-medium text-gray-700">
                  OpenAI API Key *
                </Label>
                <Input
                  id="openai_api_key"
                  type="password"
                  placeholder="sk-..."
                  value={formData.apiKeys.openai_api_key}
                  onChange={(e) => handleApiKeyChange('openai_api_key', e.target.value)}
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for OpenAI model inference. Will be TEE-encrypted.
                </p>
              </div>
            )}

            {formData.modelProvider === 'anthropic' && (
              <div>
                <Label htmlFor="anthropic_api_key" className="text-sm font-medium text-gray-700">
                  Anthropic API Key *
                </Label>
                <Input
                  id="anthropic_api_key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={formData.apiKeys.anthropic_api_key}
                  onChange={(e) => handleApiKeyChange('anthropic_api_key', e.target.value)}
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for Anthropic model inference. Will be TEE-encrypted.
                </p>
              </div>
            )}

            {formData.modelProvider === 'custom' && (
              <div>
                <Label htmlFor="custom_api_key" className="text-sm font-medium text-gray-700">
                  Custom Endpoint API Key / Bearer Token (Optional)
                </Label>
                <Input
                  id="custom_api_key"
                  type="password"
                  placeholder="Bearer token or API key..."
                  value={formData.apiKeys.custom_api_key}
                  onChange={(e) => handleApiKeyChange('custom_api_key', e.target.value)}
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank if your custom endpoint doesn't require authentication.
                </p>
              </div>
            )}
            
            {formData.modelProvider === 'multiple' && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-sm text-yellow-900">
                  Multiple provider credentials are not fully supported via the UI yet.
                  Please deploy with a single provider first or contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <Button
              onClick={() => setCurrentStep(2)}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep(4)}
              disabled={
                (formData.modelProvider === 'openai' && !formData.apiKeys.openai_api_key) ||
                (formData.modelProvider === 'anthropic' && !formData.apiKeys.anthropic_api_key) ||
                formData.modelProvider === 'multiple'
              }
              className="bg-orange-500 hover:bg-orange-600"
            >
              Next: Review
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <Card className="bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Review & Submit
          </h2>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: formData.color + '20' }}
              >
                {formData.icon}
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {formData.name || 'Your Agent Name'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {formData.description || 'Agent description will appear here'}
                </p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 bg-white rounded-full text-gray-700 font-medium">
                    {CATEGORIES.find(c => c.value === formData.category)?.label || 'Category'}
                  </span>
                  <span className="text-orange-600 font-bold">
                    {formData.pricePerRun || '0'} CRD per run
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Category</span>
              <span className="font-medium text-gray-900">
                {CATEGORIES.find(c => c.value === formData.category)?.label}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Model Provider</span>
              <span className="font-medium text-gray-900">
                {MODEL_PROVIDERS.find(p => p.value === formData.modelProvider)?.label}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Price Per Run</span>
              <span className="font-medium text-gray-900">{formData.pricePerRun} CRD</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Your Earnings (90%)</span>
              <span className="font-bold text-green-600">
                {formData.pricePerRun ? (parseFloat(formData.pricePerRun) * 0.9).toFixed(2) : '0.00'} CRD
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Input Fields</span>
              <span className="font-medium text-gray-900">
                {formData.inputFields.filter(f => f.name).length} fields
              </span>
            </div>
          </div>

          {/* Terms */}
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-900">
              <strong>Review Process:</strong> Your agent will be reviewed within 24-48 hours. 
              We'll notify you at your email once it's approved. All agents must comply with our 
              marketplace guidelines and provide accurate, helpful results.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-sm text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between mt-8">
            <Button
              onClick={() => setCurrentStep(3)}
              variant="outline"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Agent
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
