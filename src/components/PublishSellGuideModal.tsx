import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Smartphone, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck,
  FileArchive,
  Usb,
  FolderDown,
  CheckCircle2,
  Sparkles,
  Github,
  Globe,
  UploadCloud,
  FileCode,
  ExternalLink,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playSuccessChime } from '../utils/audio';

interface PublishSellGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishSellGuideModal: React.FC<PublishSellGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [copiedDistLink, setCopiedDistLink] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [isDownloadingDist, setIsDownloadingDist] = useState(false);
  const [distDownloaded, setDistDownloaded] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);
  const [sourceDownloaded, setSourceDownloaded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'pc' | 'mobile' | 'github'>('github');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const distDownloadUrl = `${originUrl}/pedros_pos_github_pages_dist.zip`;
  const sourceDownloadUrl = `${originUrl}/pedros_pos_project.zip`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&color=10b981&bgcolor=0c0a09`;

  const githubWorkflowCode = `name: Deploy pedros POS to GitHub Pages
on:
  push:
    branches: ['main', 'master']
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - uses: actions/deploy-pages@v4`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyDistLink = () => {
    navigator.clipboard.writeText(distDownloadUrl);
    setCopiedDistLink(true);
    setTimeout(() => setCopiedDistLink(false), 2500);
  };

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(githubWorkflowCode);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2500);
  };

  const handleDownloadDistZip = () => {
    try {
      playSuccessChime();
    } catch {
      // ignore
    }
    setIsDownloadingDist(true);
    
    const link = document.createElement('a');
    link.href = '/pedros_pos_github_pages_dist.zip';
    link.setAttribute('download', 'pedros_pos_github_pages_dist.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloadingDist(false);
      setDistDownloaded(true);
      setTimeout(() => setDistDownloaded(false), 4000);
    }, 600);
  };

  const handleDownloadSourceZip = () => {
    try {
      playSuccessChime();
    } catch {
      // ignore
    }
    setIsDownloadingSource(true);
    
    const link = document.createElement('a');
    link.href = '/pedros_pos_project.zip';
    link.setAttribute('download', 'pedros_pos_project.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloadingSource(false);
      setSourceDownloaded(true);
      setTimeout(() => setSourceDownloaded(false), 4000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-stone-950 border border-emerald-900/60 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-stone-100 animate-in fade-in zoom-in duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stone-950 via-emerald-950/40 to-stone-950 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Connect to Device (PC & مۆبایل & GitHub)
              </h2>
              <p className="text-xs text-stone-400">
                هۆستکردنی پڕۆژە لەسەر GitHub بەبێ بەرامبەر، یان بردنە سەر کۆمپیوتەر و مۆبایل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live URL & Instant Download Quick Bar */}
        <div className="px-5 py-3 bg-stone-900/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs text-stone-400 whitespace-nowrap font-medium">بەستەری پڕۆژە:</span>
            <code className="text-xs bg-stone-950 px-2.5 py-1.5 rounded-lg border border-stone-800 text-emerald-300 font-mono truncate max-w-xs sm:max-w-sm select-all">
              {currentUrl}
            </code>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition-all border border-stone-700 active:scale-95 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کۆپیکرا!' : 'کۆپیکردنی بەستەر'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Dist ZIP for GitHub Download Button */}
            <button
              onClick={handleDownloadDistZip}
              disabled={isDownloadingDist}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border transition-all active:scale-95 ${
                distDownloaded
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              }`}
              title="دابەزاندنی فایلی ئامادەکراوی وێب بۆ GitHub Pages"
            >
              {distDownloaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  <span>داگیرا! (بۆ GitHub)</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isDownloadingDist ? 'داگرتن...' : 'فایلی وێب (بۆ GitHub)'}</span>
                </>
              )}
            </button>

            {/* Quick Install Action if available */}
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-600/40 font-bold text-xs transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دابەزاندنی ئەپ</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('github')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
              activeSubTab === 'github'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Github className="w-4 h-4 text-emerald-400" />
            <span>١. هۆستکردن لەسەر GitHub (بێبەرامبەر)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('pc')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
              activeSubTab === 'pc'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>٢. دانان لەسەر کۆمپیوتەر (PC)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('mobile')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
              activeSubTab === 'mobile'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>٣. دانان لەسەر مۆبایل و تابلێت</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* TAB 1: GITHUB HOSTING & DOWNLOADS */}
          {activeSubTab === 'github' && (
            <div className="space-y-5">
              
              {/* Solution Notice for User */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-stone-900 to-stone-900 border border-emerald-600/40 flex items-start gap-3">
                <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 space-y-1.5 leading-relaxed">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    چۆن ئەم پڕۆژەیە لەسەر GitHub Pages بە بێبەرامبەر هۆست دەکەیت؟
                  </h3>
                  <p>
                    هۆکاری ئەوەی فایلی ZIPی سەرەتایی ڕاستەوخۆ لەسەر وێب کار ناکات ئەوەیە کە کۆدی پڕۆگرامینگە (<code className="text-emerald-300">.tsx/.ts</code>)، و سێرڤەرەکانی وێب وەک GitHub پێویستیان بە فایلی <strong className="text-white">HTML و JavaScriptی وەرگێڕدراو (Static Build)</strong> هەیە.
                  </p>
                  <p className="text-emerald-300 font-semibold">
                    ئێستا هەردوو جۆرەکەمان بە تەواوی و بە ناونیشانی خۆکارانەی (<code className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">./assets</code>) بۆ ئامادە کردوویت تا بە یەک کلیک لەسەر GitHub دایبنێیت!
                  </p>
                </div>
              </div>

              {/* Two Primary Download Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option A: Static Build Ready for GitHub Pages */}
                <div className="p-5 rounded-2xl bg-stone-900/90 border border-emerald-500/50 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>ئاسانترین ڕێگا بۆ GitHub Pages</span>
                    </div>
                    <h4 className="font-black text-base text-white">
                      فایلی ئامادەکراوی وێب (Static Build)
                    </h4>
                    <p className="text-stone-300 text-xs leading-relaxed">
                      هەموو پەڕەی <code className="text-emerald-300">index.html</code>، فایلی ستایڵ و سکریپتەکان بە تەواوی ئامادەن. تەنیا فایلەکانی دەربهێنە و بیخەرە ناو ڕیپۆزیتۆری GitHub، یەکسەر دەبێتە ماڵپەڕ!
                    </p>
                    <div className="text-[11px] text-stone-400 font-mono">
                      ناوی فایل: <span className="text-emerald-400 font-bold">pedros_pos_github_pages_dist.zip</span> (~448 KB)
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-800">
                    <button
                      onClick={handleDownloadDistZip}
                      disabled={isDownloadingDist}
                      className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 ${
                        distDownloaded
                          ? 'bg-emerald-700 text-white'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950'
                      }`}
                    >
                      {distDownloaded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                          <span>داگیرا! (فایلەکانی وێب)</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>{isDownloadingDist ? 'داگرتن...' : 'داگرتنی فایلی ئامادەکراوی وێب (ZIP)'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCopyDistLink}
                      className="w-full text-center text-[11px] text-stone-400 hover:text-emerald-300 flex items-center justify-center gap-1 py-1"
                    >
                      {copiedDistLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDistLink ? 'لینکی داگرتن کۆپیکرا!' : 'کۆپیکردنی لینکی داگرتنی ڕاستەوخۆ'}</span>
                    </button>
                  </div>
                </div>

                {/* Option B: Full Source Code with GitHub Actions */}
                <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 text-[11px] font-bold">
                      <FileCode className="w-3 h-3 text-emerald-400" />
                      <span>کۆدی سەرچاوە + GitHub Actions</span>
                    </div>
                    <h4 className="font-black text-base text-white">
                      تەواوی کۆدی سەرچاوە (Source Code)
                    </h4>
                    <p className="text-stone-300 text-xs leading-relaxed">
                      هەموو کۆدە سەرەکییەکانی React و TypeScript لەگەڵ فایلی <code className="text-emerald-400">deploy.yml</code>ی خۆکارانە بۆ ئەوەی هەر کاتێک pushت کرد بۆ GitHub، خۆی buildی بکات و پەخشی بکات.
                    </p>
                    <div className="text-[11px] text-stone-400 font-mono">
                      ناوی فایل: <span className="text-emerald-400 font-bold">pedros_pos_project.zip</span> (~220 KB)
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-800">
                    <button
                      onClick={handleDownloadSourceZip}
                      disabled={isDownloadingSource}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                        sourceDownloaded
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                      }`}
                    >
                      {sourceDownloaded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                          <span>داگیرا! (کۆدی سەرچاوە)</span>
                        </>
                      ) : (
                        <>
                          <FileArchive className="w-4 h-4 text-emerald-400" />
                          <span>{isDownloadingSource ? 'داگرتن...' : 'داگرتنی تەواوی کۆد (Source ZIP)'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCopyWorkflow}
                      className="w-full text-center text-[11px] text-stone-400 hover:text-emerald-300 flex items-center justify-center gap-1 py-1"
                    >
                      {copiedWorkflow ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWorkflow ? 'کۆدی Workflow کۆپیکرا!' : 'کۆپیکردنی فایلی deploy.yml بۆ GitHub'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Step by Step Guide: How to deploy on GitHub Pages */}
              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Github className="w-4 h-4 text-emerald-400" />
                  <span>هەنگاو بە هەنگاو: چۆن بە ١ خولەک لەسەر GitHub Pages پڕۆژەکەت دەکەیتە وێبسایت؟</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center justify-center">١</span>
                    <strong className="text-white text-xs block">دروستکردنی Repo</strong>
                    <p className="text-stone-400 text-xs leading-relaxed">
                      بڕۆ بۆ <strong className="text-emerald-400">github.com</strong> و حسابی خۆت بکەرەوە، پاشان کلیک لە <strong>New Repository</strong> بکە بە ناوی دڵخوازت (مثلا <code className="text-stone-300">pedros-pos</code>).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center justify-center">٢</span>
                    <strong className="text-white text-xs block">دانانی فایلەکان</strong>
                    <p className="text-stone-400 text-xs leading-relaxed">
                      فایلی <strong>pedros_pos_github_pages_dist.zip</strong> بکەرەوە (Extract All)، پاشان فایلەکانی ناوی بە Drag & Drop فڕێبدە ناو GitHub و کلیک لە <strong>Commit changes</strong> بکە.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center justify-center">٣</span>
                    <strong className="text-white text-xs block">چالاککردنی Pages</strong>
                    <p className="text-stone-400 text-xs leading-relaxed">
                      لە بەشی سەرەوەی ڕیپۆزیتۆری بڕۆ بۆ <strong>Settings &rarr; Pages</strong>، لە بەشی Branch هەڵبژێرە <strong>main</strong> و کلیک لە <strong>Save</strong> بکە.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between gap-3 text-xs">
                  <div className="text-stone-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>بەستەری ماڵپەڕەکەت بەردەوام دەبێت: <strong className="text-emerald-400 font-mono">https://username.github.io/pedros-pos/</strong></span>
                  </div>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950 border border-emerald-700/60 px-2 py-0.5 rounded font-bold shrink-0">
                    بێبەرامبەر هەمیشەیی
                  </span>
                </div>
              </div>

              {/* Netlify / Vercel Alternative */}
              <div className="p-3.5 rounded-xl bg-stone-900/40 border border-stone-800 flex items-center justify-between gap-3 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone-300" />
                  <span>
                    هەروەها دەتوانیت فایلی <strong className="text-white">pedros_pos_github_pages_dist.zip</strong> ڕاستەوخۆ فڕێبدەیتە ناو <strong>Netlify.com</strong> یان <strong>Vercel.com</strong> بۆ ئەوەی بە چەند چرکەیەک ماڵپەڕەکەت کار بکات.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PC Installation */}
          {activeSubTab === 'pc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-900 border border-emerald-900/40">
                <h3 className="font-bold text-base text-white flex items-center gap-2 mb-2">
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  چۆن دەچێتە ناو کۆمپیوتەری کاشێر لە سوپەرمارکێت؟
                </h3>
                <p className="text-stone-300 text-xs leading-relaxed">
                  ئەم بەرنامەیە لەسەر ستانداردەکانی <strong className="text-emerald-400">PWA (Progressive Web App)</strong> دروستکراوە. کاتێک بەستەرەکە لەسەر کۆمپیوتەری سوپەرمارکێت دەکەیتەوە، پێویست ناکات وەک وێبسایت بەکاری بهێنن؛ ڕاستەوخۆ دەبێتە بەرنامەی فەرمی ویندۆز لەسەر Desktop!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-stone-950 font-black flex items-center justify-center text-xs">
                    ١
                  </div>
                  <h4 className="font-bold text-white text-xs">لە وێبگەڕی کۆمپیوتەر بیکەرەوە</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    لە کۆمپیوتەری مارکێت لە Google Chrome یان Microsoft Edge بەستەری پڕۆژەکەت بکەرەوە.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-stone-950 font-black flex items-center justify-center text-xs">
                    ٢
                  </div>
                  <h4 className="font-bold text-white text-xs">کلیک لە «Install» بکە</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    لە سەرەوەی گەڕانچیدا لە تەنیشت بەستەرەکە یان لە دوگمەی ناوخۆی بەرنامەکە کلیک لە <strong>Install App</strong> بکە.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-stone-950 font-black flex items-center justify-center text-xs">
                    ٣
                  </div>
                  <h4 className="font-bold text-white text-xs">ئایکۆن لەسەر Desktop دروست دەبێت</h4>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    بەرنامەکە ڕاستەوخۆ دەکەوێتە سەر شاشەی کۆمپیوتەر (Desktop) و بەبێ گەڕانچی دەکرێتەوە و لە ئۆفلاینیش کار دەکات.
                  </p>
                </div>
              </div>

              {/* Offline & ZIP Transfer Option inside PC tab */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-stone-900 to-stone-900 border border-emerald-600/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Usb className="w-4 h-4" />
                    <span>بردن بە فلاش مێمۆری (USB Flash) بە فایلی ZIP:</span>
                  </div>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    ئەگەر کۆمپیوتەری مارکێت ئینتەرنێتی نەبوو، دەتوانیت تەواوی فایلە ئامادەکراوەکانی وێب یان سەرچاوەکە داببەزێنیت و بیخەیتە سەر فلاش مێمۆری.
                  </p>
                </div>
                <button
                  onClick={handleDownloadDistZip}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 shrink-0"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>داگرتنی فایلی ZIP</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 space-y-1">
                  <strong className="text-white block">پەیوەستکردنی بارکۆد خوێنەر و پرنتەر لەسەر PC:</strong>
                  <span>
                    هەموو بارکۆد خوێنەرێکی USB و تەڕازووی بارکۆددار بە شێوەی خۆکار ڕاستەوخۆ لەسەر شاشەی POS کار دەکەن. لەگەڵ پرنتەری وەسڵی 80mm تەنیا کلیک لە "چاپکردنی وەسڵ" دەکرێت.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Mobile Installation */}
          {activeSubTab === 'mobile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-900 border border-emerald-900/40 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 shrink-0">
                  <img 
                    src={qrCodeUrl} 
                    alt="Mobile QR Code" 
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-right">
                  <span className="text-[11px] bg-emerald-950 border border-emerald-700/50 text-emerald-300 px-2 py-0.5 rounded-full inline-block font-bold">
                    سکانکردنی خێرا بە مۆبایل
                  </span>
                  <h3 className="font-bold text-base text-white">
                    کامێرای مۆبایلەکەت لەسەر ئەم کۆدە ڕابگرە
                  </h3>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    کامێرای هەر مۆبایلێک یان تابلێتێک (ئەندرۆید یان ئایفۆن) بەکاربهێنە بۆ ئەوەی ڕاستەوخۆ بەستەرەکە بکەیتەوە لەسەر مۆبایل و دایبەزێنیتە سەر شاشەی مۆبایل.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-stone-900/70 border border-stone-800 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    مۆبایلی ئەندرۆید (Samsung / Xiaomi / Huawei):
                  </h4>
                  <ul className="text-xs text-stone-300 space-y-1 list-disc list-inside">
                    <li>بەستەرەکە لە Google Chrome بکەرەوە.</li>
                    <li>دوگمەی خوارەوە لەسەر شاشە دەنووسێت <strong>«Install pedros POS»</strong>.</li>
                    <li>یان لە ٣ خاڵەکەی سەرەوە کلیک لە <strong>«Add to Home screen»</strong> بکە.</li>
                    <li>دەبێتە ئەپڵیکەیشنێکی سەربەخۆ لەناو مۆبایلدا.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/70 border border-stone-800 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    مۆبایلی ئایفۆن و ئایپاد (Apple iOS):
                  </h4>
                  <ul className="text-xs text-stone-300 space-y-1 list-disc list-inside">
                    <li>بەستەرەکە لە وێبگەڕی <strong>Safari</strong> بکەرەوە.</li>
                    <li>لە خوارەوە پەنجە بنێ بە نیشانەی هاوبەشکردن (<strong>Share Icon</strong>).</li>
                    <li>بڕۆ خوارەوە و کلیک لە <strong>«Add to Home Screen»</strong> بکە.</li>
                    <li>بەرنامەکە لەگەڵ ئایکۆنی ڕەش و سەوز دەکەوێتە سەر شاشەی ئایفۆن.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-950 border-t border-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">
              سیستەمی بازرگانی pedros POS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-emerald-400 border border-emerald-900/50">
              GitHub Ready
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
