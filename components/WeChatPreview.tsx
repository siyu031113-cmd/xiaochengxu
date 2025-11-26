import React from 'react';
import { ArticleData } from '../types';
import ReactMarkdown from 'react-markdown';
import { Eye, Heart, MoreHorizontal, ChevronLeft, User } from 'lucide-react';

interface WeChatPreviewProps {
  data: ArticleData;
}

const WeChatPreview: React.FC<WeChatPreviewProps> = ({ data }) => {
  return (
    <div className="w-[375px] h-[812px] bg-white border-8 border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col mx-auto">
      {/* iOS Status Bar Mock */}
      <div className="h-12 bg-white flex justify-between items-center px-6 pt-2 shrink-0 z-10 text-black select-none">
        <span className="font-semibold text-sm">9:41</span>
        <div className="flex space-x-1.5 items-end h-3">
            <div className="w-1 h-1.5 bg-black rounded-sm"></div>
            <div className="w-1 h-2 bg-black rounded-sm"></div>
            <div className="w-1 h-2.5 bg-black rounded-sm"></div>
            <div className="w-4 h-2.5 border border-black rounded-[2px] relative ml-1">
                <div className="absolute inset-0.5 bg-black"></div>
            </div>
        </div>
      </div>

      {/* WeChat Header */}
      <div className="h-11 border-b border-gray-100 flex items-center justify-between px-3 shrink-0 bg-white z-10">
        <div className="flex items-center text-gray-800">
            <ChevronLeft size={24} />
            <span className="ml-1 text-[17px] font-medium text-gray-800">WeChat</span>
        </div>
        <MoreHorizontal size={24} className="text-gray-800" />
      </div>

      {/* Article Scroll Area */}
      <div className="flex-1 overflow-y-auto bg-white scroll-smooth no-scrollbar">
        <div className="px-5 py-6">
            {/* Title */}
            <h1 className="text-[22px] font-bold leading-[1.4] text-[#333] mb-4 tracking-tight">
                {data.title || "Article Title"}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center text-[15px] mb-6 text-[rgba(0,0,0,0.5)]">
                <span className="mr-2.5 truncate max-w-[120px] font-medium text-[#576b95]">
                   {data.accountName || "Official Account"}
                </span>
                <span className="mr-2.5 font-light text-gray-400">
                    {data.date || new Date().toLocaleDateString()}
                </span>
                <span className="font-light text-[#576b95]">Beijing</span>
            </div>

            {/* Cover Image */}
            {data.coverImage && (
                <div className="w-full aspect-[2.35/1] rounded-lg overflow-hidden mb-6 bg-gray-100">
                    <img 
                        src={data.coverImage} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            
            {/* Disclaimer / Top Info */}
            {data.digest && (
                <div className="bg-[#f7f7f7] p-4 rounded text-[15px] text-[#666] mb-6 leading-relaxed">
                    {data.digest}
                </div>
            )}

            {/* Content Body */}
            <div className="prose prose-slate prose-p:text-[17px] prose-p:leading-[1.6] prose-p:text-[#333] prose-headings:text-[#333] prose-img:rounded-lg max-w-none font-normal">
               <ReactMarkdown>
                 {data.content || "Start writing or generate content to see it here..."}
               </ReactMarkdown>
            </div>

            {/* Bottom Meta */}
            <div className="mt-12 pt-6 flex items-center justify-between text-[14px] text-[#888]">
                <div className="flex items-center space-x-4">
                     <span className="flex items-center">
                        <span className="mr-1">Read</span>
                        <span>100k+</span>
                     </span>
                     <span className="flex items-center">
                        <Heart size={16} className="mr-1" />
                        <span>2.5k</span>
                     </span>
                </div>
                <div className="px-3 py-1 border border-[#e7e7e7] rounded text-[#576b95] text-xs">
                    Share
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Home Indicator */}
      <div className="h-5 bg-white flex justify-center items-start shrink-0">
          <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
};

export default WeChatPreview;
