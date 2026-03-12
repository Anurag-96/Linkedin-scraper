'use client';

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Search, Linkedin, Calendar, ExternalLink, Loader2, Building2, User, AlertCircle, Copy, Check, Settings, Info, Zap, Sparkles, Filter, ChevronRight, Share2 } from 'lucide-react';
import { format, subMonths, isAfter, parseISO } from 'date-fns';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('http')) return cleanUrl;
  if (cleanUrl.startsWith('www.')) return `https://${cleanUrl}`;
  if (cleanUrl.includes('linkedin.com')) return `https://${cleanUrl}`;
  return cleanUrl;
};

interface LinkedInPost {
  id: string;
  url: string;
  author: string;
  content: string;
  date: string;
  relevance: string;
}

export default function LinkedInScraper() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'person' | 'company'>('person');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const DEFAULT_SERP_KEY = '';
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [serpApiKey, setSerpApiKey] = useState(DEFAULT_SERP_KEY);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedSerpKey = localStorage.getItem('serp_api_key');
    if (savedSerpKey) setSerpApiKey(savedSerpKey);
  }, []);

  const saveSerpKey = (key: string) => {
    setSerpApiKey(key);
    localStorage.setItem('serp_api_key', key);
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearch = async (e: React.FormEvent, isDemo = false) => {
    e.preventDefault();
    if (!query.trim() && !isDemo) return;

    setIsSearching(true);
    setError(null);
    setPosts([]);
    setActiveTab(0);

    if (isDemo) {
      setQuery("Elon Musk");
      setSearchType("person");
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1500));
      const demoPosts: LinkedInPost[] = [
        {
          id: "demo-1",
          author: "Tech Insider",
          url: "https://www.linkedin.com/posts/elon-musk-ai-future",
          content: "Spotted: Elon Musk discussing the future of neural interfaces at the latest tech summit. The implications for human-computer interaction are staggering.",
          date: format(new Date(), 'yyyy-MM-dd'),
          relevance: "Direct mention of subject in a high-engagement tech discussion."
        },
        {
          id: "demo-2",
          author: "Future Systems",
          url: "https://www.linkedin.com/posts/robotics-musk-impact",
          content: "How the latest Mars mission plans are reshaping our perspective on interplanetary travel. Mention of SpaceX's recent milestones.",
          date: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
          relevance: "Relevant industry mention related to subject's core ventures."
        },
        {
          id: "demo-3",
          author: "Global Business Review",
          url: "https://www.linkedin.com/posts/leadership-musk-style",
          content: "Analysis: Leadership styles that define the 21st century. Case study on Tesla's rapid growth and market disruption.",
          date: format(subMonths(new Date(), 2), 'yyyy-MM-dd'),
          relevance: "Business analysis citing subject as a key figure."
        },
        {
          id: "demo-4",
          author: "AI Ethics Daily",
          url: "https://www.linkedin.com/posts/ai-musk-opinion",
          content: "Important discussion today on AI safety protocols. Citing Musk's recent warnings about unregulated AGI development.",
          date: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
          relevance: "Topical mention in specialized field."
        }
      ];
      setPosts(demoPosts);
      setIsSearching(false);
      return;
    }

    try {
      const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM-dd');
      let searchResultsContext = "";

      if (isAdvancedSearch) {
        try {
          const scraperRes = await fetch('/api/linkedin/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, searchType, serpApiKey }),
          });
          
          if (scraperRes.ok) {
            const data = await scraperRes.json();
            const rawData = data.raw_data || data.organic_results || data;
            searchResultsContext = `Here is raw data: ${JSON.stringify(rawData).slice(0, 100000)}`;
          } else {
            const errData = await scraperRes.json();
            throw new Error(errData.error || 'Advanced Search failed');
          }
        } catch (err: any) {
          setError(`Advanced Search failed: ${err.message}. Falling back.`);
        }
      }

      const prompt = `Search for LinkedIn posts from the last 6 months (post-${sixMonthsAgo}) mentioning "${query}". Provide at least 20 real posts.
      ${searchResultsContext ? `Context: ${searchResultsContext}` : 'Use Google Search grounding.'}
      Return JSON: {"posts": [{"id": "...", "url": "...", "author": "...", "content": "...", "date": "YYYY-MM-DD", "relevance": "..."}]}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          tools: searchResultsContext ? [] : [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response.text || '{"posts": []}');
      const filteredPosts = (result.posts || []).filter((post: any) => {
        try { return isAfter(parseISO(post.date), subMonths(new Date(), 6)); } catch { return true; }
      });

      setPosts(filteredPosts);
      if (filteredPosts.length === 0 && !error) setError("No recent mentions found.");
    } catch (err) {
      setError("Failed to fetch LinkedIn posts.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 selection:bg-blue-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-card px-6 py-4 flex justify-between items-center bg-zinc-950/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              LI-INT <span className="text-[10px] font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20">PRO v1.2</span>
            </h1>
            <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest font-sans">Professional Intelligence Agency</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 hover:bg-white/5 border border-white/10 rounded-xl transition-all hover:border-white/20"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6"
          >
            <Sparkles className="w-3 h-3" />
            AI-POWERED SEARCH GROUNDING
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6"
          >
            Find any mention. <br/><span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Across the professional graph.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Deep scanning technology that uncovers public LinkedIn posts, activity, and mentions from the last 180 days with zero login required.
          </motion.p>
        </div>

        {/* Search Station */}
        <section className="mb-20">
          <form onSubmit={(e) => handleSearch(e)} className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-4 p-2 bg-zinc-900/50 border border-white/10 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-4 px-4 py-2">
                <Search className="w-6 h-6 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Enter ${searchType} name to track...`}
                  className="w-full bg-transparent text-xl md:text-2xl font-medium outline-none placeholder:text-slate-600 text-white"
                />
                <div className="flex gap-2">
                   <button 
                    onClick={(e) => handleSearch(e, true)}
                    type="button" 
                    disabled={isSearching}
                    className="border border-white/10 hover:bg-white/5 text-white p-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 px-4 whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" /> 
                    <span className="font-bold uppercase tracking-wider text-[10px]">Try Demo</span>
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2 px-6"
                  >
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> <span className="hidden md:inline font-bold uppercase tracking-wider text-xs">Analyze</span></>}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 border-t border-white/5 bg-zinc-950/30 rounded-b-xl">
                 <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setSearchType('person')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${searchType === 'person' ? 'bg-white text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    PERSON
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSearchType('company')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${searchType === 'company' ? 'bg-white text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    COMPANY
                  </button>
                </div>

                <div className="flex items-center gap-6 pr-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">Advanced Engine</span>
                    <div className="relative w-10 h-6 flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer sr-only" 
                        checked={isAdvancedSearch}
                        onChange={(e) => {
                          if (e.target.checked && !serpApiKey) setShowSettings(true);
                          setIsAdvancedSearch(e.target.checked);
                        }}
                      />
                      <div className="w-full h-full bg-zinc-800 border border-white/10 rounded-full peer-checked:bg-blue-600 transition-colors" />
                      <div className="absolute left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-5" />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Results Deck */}
        <section>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-12 max-w-2xl mx-auto"
            >
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </motion.div>
          )}

          {posts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Live Intelligence Results</h3>
                  <span className="text-[10px] bg-zinc-800 text-slate-400 px-2 py-0.5 rounded border border-white/5">{posts.length} FEED ITEMS</span>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, Math.ceil(posts.length / 10)) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-bold border transition-all ${activeTab === i ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-900 border-white/5 text-slate-500 hover:border-white/20'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {posts.slice(activeTab * 10, (activeTab + 1) * 10).map((post, index) => {
                    const globalIndex = activeTab * 10 + index;
                    return (
                      <motion.div
                        key={post.id || globalIndex}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative bg-zinc-900/40 border border-white/10 p-6 rounded-2xl hover:bg-zinc-900/60 hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 transition-colors">
                              <Linkedin className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{post.author}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                <Calendar className="w-3 h-3" />
                                {post.date}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyToClipboard(ensureAbsoluteUrl(post.url), post.id || globalIndex.toString())}
                              className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              {copiedId === (post.id || globalIndex.toString()) ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            </button>
                            <a 
                              href={ensureAbsoluteUrl(post.url)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>

                        <div className="relative">
                          <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 mb-4">
                            {post.content}
                          </p>
                          <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                            <p className="text-[11px] text-slate-500 font-medium italic flex gap-2">
                              <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              {post.relevance}
                            </p>
                          </div>
                        </div>
                        
                        <div className="absolute right-4 bottom-4 pointer-events-none opacity-5">
                          <span className="text-4xl font-black italic">{(globalIndex + 1).toString().padStart(2, '0')}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {!isSearching && posts.length === 0 && !error && (
            <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-3xl">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                Search parameters required for scanning
              </p>
            </div>
          )}

          {isSearching && (
            <div className="py-32 text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 animate-pulse">Scanning Global Index</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">
                {isAdvancedSearch ? 'Executing deep-context scraping...' : 'Awaiting network response...'}
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 px-6 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/10">
                <Linkedin className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 tracking-tighter uppercase">© 2026 LI-INT Intelligence Systems</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Operational</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Grounding</p>
              <span className="text-[10px] font-bold text-blue-400 uppercase">Gemini 3 Flash</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-900 border border-white/10 p-8 max-w-md w-full relative z-10 rounded-3xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-blue-500" />
                  <h2 className="text-xl font-bold text-white tracking-tight">System Config</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white transition-colors">
                  <span className="text-3xl font-light">×</span>
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SerpApi Protocol</label>
                    <button onClick={() => saveSerpKey(DEFAULT_SERP_KEY)} className="text-[10px] font-bold text-blue-500 uppercase hover:underline">Reset</button>
                  </div>
                  <input 
                    type="password"
                    value={serpApiKey}
                    onChange={(e) => saveSerpKey(e.target.value)}
                    placeholder="Enter Private Access Key..."
                    className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-sm font-mono text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                  <div className="mt-4 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 flex gap-3">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Advanced Engine uses <span className="text-blue-400 font-bold">SerpApi</span> for professional-grade scraping. Required for deep search capabilities.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20"
                >
                  Authorize Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
