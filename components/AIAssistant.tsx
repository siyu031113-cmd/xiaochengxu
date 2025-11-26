import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, PenTool, Loader2 } from 'lucide-react';
import { generateArticleContent, generateArticleIdeas, generateCoverImage } from '../services/geminiService';
import { GeneratorStatus } from '../types';

interface AIAssistantProps {
  onUpdateContent: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateImage: (base64: string) => void;
  currentTopic: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onUpdateContent, onUpdateTitle, onUpdateImage, currentTopic }) => {
  const [status, setStatus] = useState<GeneratorStatus>(GeneratorStatus.IDLE);
  const [activeTab, setActiveTab] = useState<'write' | 'image' | 'ideas'>('write');
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState<string[]>([]);

  const handleGenerateText = async () => {
    if (!prompt && !currentTopic) return;
    setStatus(GeneratorStatus.LOADING);
    try {
      const topic = prompt || currentTopic;
      const content = await generateArticleContent(topic);
      onUpdateContent(content);
      setStatus(GeneratorStatus.SUCCESS);
    } catch (e) {
      setStatus(GeneratorStatus.ERROR);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt && !currentTopic) return;
    setStatus(GeneratorStatus.LOADING);
    try {
        const topic = prompt || currentTopic;
        const base64 = await generateCoverImage(topic);
        if (base64) {
            onUpdateImage(base64);
            setStatus(GeneratorStatus.SUCCESS);
        } else {
            setStatus(GeneratorStatus.ERROR);
        }
    } catch (e) {
        setStatus(GeneratorStatus.ERROR);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!prompt) return;
    setStatus(GeneratorStatus.LOADING);
    try {
        const newIdeas = await generateArticleIdeas(prompt);
        setIdeas(newIdeas);
        setStatus(GeneratorStatus.SUCCESS);
    } catch (e) {
        setStatus(GeneratorStatus.ERROR);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center space-x-2 mb-4 text-emerald-600 font-medium">
        <Sparkles size={20} />
        <h2>Gemini AI Assistant</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {[
            { id: 'write', label: 'Write', icon: PenTool },
            { id: 'image', label: 'Cover', icon: ImageIcon },
            { id: 'ideas', label: 'Ideas', icon: Sparkles }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.id 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <tab.icon size={16} />
                <span>{tab.label}</span>
            </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'write' && (
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Topic or Keywords</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. The future of AI in China..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                />
                <button 
                    onClick={handleGenerateText}
                    disabled={status === GeneratorStatus.LOADING}
                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                    {status === GeneratorStatus.LOADING ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    Generate Article
                </button>
            </div>
        )}

        {activeTab === 'image' && (
             <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Image Description</label>
                <textarea 
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="Describe the cover image..."
                     className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                 />
                 <button 
                     onClick={handleGenerateImage}
                     disabled={status === GeneratorStatus.LOADING}
                     className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                 >
                     {status === GeneratorStatus.LOADING ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                     Generate Cover
                 </button>
             </div>
        )}

        {activeTab === 'ideas' && (
             <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Niche / Category</label>
                <input 
                     type="text"
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="e.g. Healthy Cooking"
                     className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                 />
                 <button 
                     onClick={handleGenerateIdeas}
                     disabled={status === GeneratorStatus.LOADING}
                     className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                 >
                     {status === GeneratorStatus.LOADING ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                     Get Brainstormed Titles
                 </button>

                 {ideas.length > 0 && (
                     <div className="mt-4 space-y-2">
                         {ideas.map((idea, idx) => (
                             <div 
                                key={idx} 
                                onClick={() => onUpdateTitle(idea)}
                                className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors"
                             >
                                {idea}
                             </div>
                         ))}
                     </div>
                 )}
             </div>
        )}
      </div>
      
      {status === GeneratorStatus.ERROR && (
          <p className="mt-3 text-xs text-red-500 text-center">Generation failed. Please check your API usage or try again.</p>
      )}
    </div>
  );
};

export default AIAssistant;
