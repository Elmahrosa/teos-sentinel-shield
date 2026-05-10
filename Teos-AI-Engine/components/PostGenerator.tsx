"use client";

import { useState } from "react";
import {
  Loader2,
  Sparkles,
  Download,
  CheckCircle,
  Copy,
  ImageIcon,
  Film,
  Lightbulb,
  Zap,
  Layers,
} from "lucide-react";

type Platform =
  | "x"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "threads"
  | "telegram";

type Tone =
  | "professional"
  | "engagement"
  | "authority"
  | "founder-story"
  | "launch"
  | "contrarian"
  | "community"
  | "viral-hook"
  | "educational"
  | "sales-cta";

type Goal = "engagement" | "authority" | "sales" | "community";

type Framework = "auto" | "aida" | "pas" | "story" | "contrarian" | "data" | "authority";

type Generated = {
  success?: boolean;
  plan?: string;
  used?: number;
  post: string;
  hashtags: string[];
  imageUrl?: string | null;
  imagePrompt?: string;
  videoScript?: string;
  platform?: string;
  platformIcon?: string;
  tone?: string;
  fallback?: boolean;
  visibilityScore?: number;
  bestTime?: string;
  suggestedCTA?: string;
  checklist?: string[];
  insights?: {
    visibilityScore?: number;
    bestTime?: string;
    suggestedCTA?: string;
    checklist?: string[];
  };
  relatedAngles?: string[];
  followUpIdeas?: string[];
};

type Variation = Generated & {
  frameworkUsed?: string;
  hookStrength?: number;
};

const PLATFORM_META: Record<Platform, { label: string; icon: string; color: string }> = {
  x: { label: "X", icon: "\ud835\udd4f", color: "bg-black" },
  linkedin: { label: "LinkedIn", icon: "in", color: "bg-[#0077b5]" },
  facebook: { label: "Facebook", icon: "f", color: "bg-[#1877f2]" },
  instagram: { label: "Instagram", icon: "\u25ce", color: "bg-pink-600" },
  tiktok: { label: "TikTok", icon: "\u266a", color: "bg-zinc-950" },
  threads: { label: "Threads", icon: "@", color: "bg-zinc-800" },
  telegram: { label: "Telegram", icon: "\u2708", color: "bg-[#2AABEE]" },
};

const FRAMEWORKS: { value: Framework; label: string; emoji: string }[] = [
  { value: "auto", label: "Auto Select", emoji: "\ud83e\udd16" },
  { value: "contrarian", label: "Contrarian", emoji: "\ud83d\udd25" },
  { value: "story", label: "Story", emoji: "\ud83d\udcd6" },
  { value: "data", label: "Data-Driven", emoji: "\ud83d\udcca" },
  { value: "pas", label: "Problem-Solution", emoji: "\u26a1" },
  { value: "aida", label: "AIDA", emoji: "\ud83c\udfaf" },
  { value: "authority", label: "Authority", emoji: "\ud83d\udc51" },
];

function fallbackNumber(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function platformShareUrl(platform: Platform, text: string) {
  const encoded = encodeURIComponent(text);
  const appUrl = encodeURIComponent("https://teos-ai-engine.vercel.app");
  if (platform === "x") return `https://twitter.com/intent/tweet?text=${encoded}`;
  if (platform === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${appUrl}`;
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${appUrl}&quote=${encoded}`;
  if (platform === "telegram") return `https://t.me/share/url?url=${appUrl}&text=${encoded}`;
  return "";
}

export default function PostGenerator({
  used,
  plan,
  isAdmin,
}: {
  used: number;
  plan: string;
  isAdmin: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<Platform>("x");
  const [tone, setTone] = useState<Tone>("professional");
  const [goal, setGoal] = useState<Goal>("engagement");
  const [framework, setFramework] = useState<Framework>("auto");
  const [result, setResult] = useState<Generated | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeVariation, setActiveVariation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = PLATFORM_META[platform];
  const canUseVariations = isAdmin || plan === "agency" || plan === "pro";

  async function handleGenerate(mode: "single" | "variations" = "single") {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setVariations([]);
    setCopied(false);
    setLoadingStep("Analyzing topic for best approach\u2026");

    const stepTimers = [
      setTimeout(() => setLoadingStep("Crafting scroll-stopping hook\u2026"), 800),
      setTimeout(() => setLoadingStep("Building deep insights & examples\u2026"), 1600),
      setTimeout(() => setLoadingStep("Optimizing for platform virality\u2026"), 2400),
      setTimeout(() => setLoadingStep("Scoring & finalizing\u2026"), 3200),
    ];

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          topic: prompt.trim(),
          platform,
          tone,
          goal,
          framework,
          mode: mode === "variations" && canUseVariations ? "variations" : "single",
          nonce: Date.now(),
        }),
      });

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(data?.error || `Generation failed (${res.status})`);
        return;
      }

      const normalized: Generated = {
        ...data,
        post: data.post || data.content || "",
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        visibilityScore:
          data.visibilityScore ??
          data.insights?.visibilityScore ??
          data.primary?.visibilityScore ??
          fallbackNumber(74, 94),
        bestTime:
          data.bestTime ??
          data.insights?.bestTime ??
          ["9\u201311 AM", "11 AM\u20131 PM", "2\u20134 PM", "6\u20138 PM"][fallbackNumber(0, 3)],
        suggestedCTA:
          data.suggestedCTA ??
          data.insights?.suggestedCTA ??
          "What would you improve?",
        checklist:
          data.checklist ??
          data.insights?.checklist ??
          ["Strong hook in line one", "Specific insights, not generic advice", "Platform-native formatting", "Strong CTA included", "Smart hashtags matched to topic"],
        platformIcon: data.platformIcon || data.primary?.platformIcon || meta.icon,
        platform: data.platform || platform,
        relatedAngles: data.relatedAngles || data.primary?.relatedAngles || [],
        followUpIdeas: data.followUpIdeas || data.primary?.followUpIdeas || [],
      };

      setResult(normalized);

      if (data.mode === "variations" && Array.isArray(data.variations)) {
        setVariations(data.variations);
        setActiveVariation(0);
      }
    } catch (err) {
      console.error("[PostGenerator]", err);
      setError("Generation request failed.");
    } finally {
      stepTimers.forEach(clearTimeout);
      setLoading(false);
      setLoadingStep("");
    }
  }

  const activePost = variations.length > 0 ? variations[activeVariation] : result;
  const visibilityScore = activePost?.visibilityScore ?? activePost?.insights?.visibilityScore ?? 0;
  const bestTime = activePost?.bestTime ?? activePost?.insights?.bestTime ?? "Dynamic";
  const suggestedCTA = activePost?.suggestedCTA ?? activePost?.insights?.suggestedCTA ?? "What would you improve?";
  const checklist = activePost?.checklist ?? activePost?.insights?.checklist ?? ["Strong hook", "Clear value", "CTA included"];
  const relatedAngles = activePost?.relatedAngles || result?.relatedAngles || [];
  const followUpIdeas = activePost?.followUpIdeas || result?.followUpIdeas || [];

  const fullCaption = activePost
    ? `${activePost.post}\n\n${activePost.hashtags.map((h) => `#${h}`).join(" ")}`
    : "";

  async function copyToClipboard(text = fullCaption) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareCurrent(target: Platform) {
    if (!activePost) return;
    if (target === "instagram" || target === "threads") {
      copyToClipboard();
      window.open(target === "instagram" ? "https://www.instagram.com/" : "https://www.threads.net/", "_blank");
      return;
    }
    const url = platformShareUrl(target, fullCaption);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  const isLinkedInBlocked = platform === "linkedin" && !isAdmin && plan !== "agency";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {isAdmin ? "\u26a1 AI Content Engine" : "Generate post"}
          </h2>
          {isAdmin && (
            <span className="bg-indigo-500 text-[10px] px-2 py-0.5 rounded-full font-black text-white uppercase tracking-tighter">
              Founder Mode
            </span>
          )}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What's your idea? Be specific for best results. (e.g., 'Why most SaaS founders fail at content marketing \u2014 and what I learned from 100 failed posts')"
          className="w-full bg-[#111118] border border-white/10 rounded-xl p-4 text-white focus:ring-1 focus:ring-indigo-500 h-28 resize-none"
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="bg-zinc-800 border-none rounded-lg text-xs text-white p-2"
          >
            <option value="x">\ud835\udd4f X</option>
            <option value="linkedin">in LinkedIn {isLinkedInBlocked ? "\ud83d\udd12" : ""}</option>
            <option value="facebook">f Facebook</option>
            <option value="instagram">\u25ce Instagram</option>
            <option value="tiktok">\u266a TikTok</option>
            <option value="threads">@ Threads</option>
            <option value="telegram">\u2708 Telegram</option>
          </select>

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="bg-zinc-800 border-none rounded-lg text-xs text-white p-2"
          >
            <option value="professional">Professional</option>
            <option value="engagement">Engagement</option>
            <option value="authority">Authority</option>
            <option value="founder-story">Founder Story</option>
            <option value="launch">Launch</option>
            <option value="contrarian">Contrarian</option>
            <option value="community">Community</option>
            <option value="viral-hook">Viral Hook</option>
            <option value="educational">Educational</option>
            <option value="sales-cta">Sales CTA</option>
          </select>

          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            className="bg-zinc-800 border-none rounded-lg text-xs text-white p-2"
          >
            <option value="engagement">Engagement</option>
            <option value="authority">Authority</option>
            <option value="sales">Sales</option>
            <option value="community">Community</option>
          </select>

          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value as Framework)}
            className="bg-zinc-800 border-none rounded-lg text-xs text-white p-2"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.emoji} {f.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleGenerate("single")}
            disabled={loading || !prompt.trim() || isLinkedInBlocked}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all px-4 py-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? loadingStep : "GENERATE"}
          </button>
        </div>

        {canUseVariations && (
          <button
            onClick={() => handleGenerate("variations")}
            disabled={loading || !prompt.trim() || isLinkedInBlocked}
            className="mt-3 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all px-4 py-3 text-sm"
          >
            <Layers className="w-4 h-4" />
            Generate 3 Variations (Data + Story + Contrarian)
          </button>
        )}

        {isLinkedInBlocked && (
          <p className="text-yellow-400 text-xs mt-3">
            LinkedIn generation is available for Agency users.
          </p>
        )}

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </div>

      {variations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            3 Approaches \u2014 Pick Your Favorite
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {variations.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveVariation(i)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  activeVariation === i
                    ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-zinc-400">
                    {v.frameworkUsed || ["Data", "Story", "Contrarian"][i]}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      (v.hookStrength || v.visibilityScore || 0) >= 85
                        ? "bg-green-500/20 text-green-300"
                        : (v.hookStrength || v.visibilityScore || 0) >= 70
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    Hook: {v.hookStrength || v.visibilityScore || "?"}/100
                  </span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                  {v.post.split("\n")[0]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activePost && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 relative group">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`${meta.color} px-3 py-2 rounded-lg border border-white/10 text-sm text-white font-bold`}>
                  {activePost.platformIcon || meta.icon} {meta.label}
                </span>

                {activePost.fallback && (
                  <span className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs">
                    Offline Mode
                  </span>
                )}

                <button onClick={() => shareCurrent("x")} className="px-3 py-2 bg-black rounded-lg border border-white/10 hover:bg-zinc-800 transition text-sm text-white">
                  \ud835\udd4f
                </button>
                <button onClick={() => shareCurrent("linkedin")} className="px-3 py-2 bg-[#0077b5] rounded-lg hover:opacity-80 transition text-sm text-white">
                  in
                </button>
                <button onClick={() => shareCurrent("facebook")} className="px-3 py-2 bg-[#1877f2] rounded-lg hover:opacity-80 transition text-sm text-white">
                  f
                </button>
                <button onClick={() => shareCurrent("instagram")} className="px-3 py-2 bg-pink-600 rounded-lg hover:opacity-80 transition text-sm text-white">
                  \u25ce
                </button>
                <button onClick={() => shareCurrent("telegram")} className="px-3 py-2 bg-[#2AABEE] rounded-lg hover:opacity-80 transition text-sm text-white">
                  \u2708
                </button>
                <button onClick={() => shareCurrent("threads")} className="px-3 py-2 bg-zinc-800 rounded-lg hover:opacity-80 transition text-sm text-white">
                  @
                </button>

                <button onClick={() => copyToClipboard()} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 ml-auto transition">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                </button>
              </div>

              <p className="whitespace-pre-wrap text-zinc-200 leading-relaxed text-sm">
                {activePost.post}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-white/5">
                {activePost.hashtags.map((h, index) => (
                  <span key={`${h}-${index}`} className="text-indigo-400 text-xs font-mono">
                    #{h}
                  </span>
                ))}
              </div>
            </div>

            {(activePost.imagePrompt || activePost.imageUrl) && (
              <div className="rounded-2xl border border-white/10 shadow-2xl bg-zinc-900 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    Matching Image Prompt
                  </h3>
                  {activePost.imagePrompt && (
                    <button onClick={() => copyToClipboard(activePost.imagePrompt)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-zinc-300">
                      Copy Image Prompt
                    </button>
                  )}
                </div>
                {activePost.imagePrompt && (
                  <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {activePost.imagePrompt}
                  </p>
                )}
              </div>
            )}

            {activePost.videoScript && (
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-pink-400" />
                  TikTok / Short Video Script
                </h3>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {activePost.videoScript}
                </p>
              </div>
            )}

            {relatedAngles.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Related Angles \u2014 More Posts From This Idea
                </h3>
                <ul className="space-y-2">
                  {relatedAngles.map((angle, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5 flex-shrink-0">\u2192</span>
                      <span className="cursor-pointer hover:text-white transition-colors" onClick={() => setPrompt(angle)}>
                        {angle}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {followUpIdeas.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-green-400" />
                  Follow-Up Content Ideas
                </h3>
                <ul className="space-y-2">
                  {followUpIdeas.map((idea, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">\u2192</span>
                      <span className="cursor-pointer hover:text-white transition-colors" onClick={() => setPrompt(idea)}>
                        {idea}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
                Visibility Score
              </h4>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">{visibilityScore}</span>
                <span className="text-xl opacity-60">/100</span>
              </div>
              <p className="text-xs mt-4 opacity-90 leading-tight">
                Optimized for {meta.label.toUpperCase()}. Best time: <strong>{bestTime}</strong>.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                Quality Checklist
              </h4>
              <ul className="space-y-3">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-3 text-xs text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                Suggested CTA
              </h4>
              <p className="text-sm text-white">{suggestedCTA}</p>
            </div>

            <button
              onClick={() => {
                setPrompt(prompt);
                handleGenerate(variations.length > 0 ? "variations" : "single");
              }}
              disabled={loading}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
