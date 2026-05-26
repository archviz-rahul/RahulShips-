"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  Users,
  Bell,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Flame,
  Check,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  Award,
  Video,
  Plus,
  RefreshCw,
  Search,
  BookOpen
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Definition for Competitor from competitorsStore
export interface DBCompetitor {
  id: string;
  name: string;
  platform: "Instagram" | "YouTube" | "Substack" | "X/Twitter" | "LinkedIn" | "Other";
  username: string;
  profileUrl: string;
  focus: string;
  status: "Active" | "Inactive";
  notes?: string;
  notesHistory?: Array<{ id: string; timestamp: string; text: string }>;
  likes?: string;
  hook?: string;
  cta?: string;
  lastScraped?: string;
  videoDuration?: number;
}

interface CompetitorAnalysisViewProps {
  isDarkMode: boolean;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  activeConfig: any;
  competitors: DBCompetitor[];
  fetchCompetitors: () => Promise<void>;
}

interface SimulatedNotification {
  id: string;
  timestamp: string;
  competitorName: string;
  username: string;
  platform: string;
  type: "milestone" | "post";
  message: string;
  badgeText: string;
  isRead: boolean;
}

// Group Types
type GroupName = "Primary Rivals" | "Emerging Threats" | "Niche Inspiration";

export function CompetitorAnalysisView({
  isDarkMode,
  showToast,
  activeConfig,
  competitors,
  fetchCompetitors
}: CompetitorAnalysisViewProps) {
  // 1. Group State: mapping of competitorId -> GroupName
  const [competitorGroups, setCompetitorGroups] = useState<Record<string, GroupName>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("viztr_competitor_groups");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved competitor groups, using defaults", e);
        }
      }
    }
    // Hardcoded highly aesthetic initial alignments to keep dashboard interesting
    return {
      "1": "Niche Inspiration", // Vaibhivi
      "2": "Primary Rivals",    // Dan Martell
      "3": "Emerging Threats",   // Ishan Sharma
      "4": "Primary Rivals",    // Raj Shamani
      "5": "Emerging Threats"    // GrowthSchool
    };
  });

  // Save competitor groups to local storage
  const saveGroups = (newGroups: Record<string, GroupName>) => {
    setCompetitorGroups(newGroups);
    localStorage.setItem("viztr_competitor_groups", JSON.stringify(newGroups));
  };

  // Move competitor to another group
  const handleMoveGroup = (id: string, group: GroupName) => {
    const updated = { ...competitorGroups, [id]: group };
    saveGroups(updated);
    showToast(`Reorganized competitor into '${group}'! 📁`, "success");
  };

  // 2. Active Tab filter for custom groups
  const [activeGroupTab, setActiveGroupTab] = useState<GroupName | "All">("All");

  // 3. Comparison Mode Selectors
  const [comparedCompIds, setComparedCompIds] = useState<string[]>(["2", "4"]);

  // 4. Notification States
  const [notifications, setNotifications] = useState<SimulatedNotification[]>(() => {
    return [
      {
        id: "notif-init-1",
        timestamp: "07:12:05 AM",
        competitorName: "Raj Shamani",
        username: "rajshamani",
        platform: "Instagram",
        type: "milestone",
        message: "crossed a historical benchmark of 110K Average Likes milestone with their latest founder traps reveal snippet! 🔥",
        badgeText: "MILESTONE BANNER",
        isRead: false
      },
      {
        id: "notif-init-2",
        timestamp: "07:05:14 AM",
        competitorName: "Vaibhivi Sinty",
        username: "vaibhavisinty",
        platform: "Instagram",
        type: "post",
        message: "published a fresh rendering highlight tutorial: 'Twinmotion vs Unreal Engine 5.5 Daylight splits'! 🏛️",
        badgeText: "NEW POST ALERT",
        isRead: false
      }
    ];
  });

  const [notificationBellCount, setNotificationBellCount] = useState<number>(2);

  // Helper to parse Likes string e.g., "42K avg" or "110K avg" to exact number values
  const parseLikesValue = (likesStr: string | undefined): number => {
    if (!likesStr) return 10000;
    const cleanStr = likesStr.toLowerCase().replace("avg", "").replace("likes", "").trim();
    if (cleanStr.includes("k")) {
      return parseFloat(cleanStr.replace("k", "")) * 1000;
    }
    if (cleanStr.includes("m")) {
      return parseFloat(cleanStr.replace("m", "")) * 1000000;
    }
    const val = parseInt(cleanStr.replace(/[^0-9]/g, ""), 10);
    return isNaN(val) ? 10000 : val;
  };

  // Base metrics by competitor ID or username to fill additional radar properties realistically
  const getCompetitorRadarMetrics = (comp: DBCompetitor) => {
    const username = comp.username?.toLowerCase() || "";
    // Base multipliers
    let postingFreq = 50; // out of 100
    let hookStrength = 65; // out of 100
    let ctaConversion = 60; // out of 100
    let videoDuration = comp.videoDuration || 45; // seconds
    
    // Convert likes avg to an engagement index score out of 100
    const likesVal = parseLikesValue(comp.likes);
    let avgEngagement = Math.min(Math.max((likesVal / 120000) * 100, 20), 100);

    if (username.includes("vaibhavisinty")) {
      postingFreq = 70;
      hookStrength = 85;
      ctaConversion = 75;
    } else if (username.includes("danmartell")) {
      postingFreq = 80;
      hookStrength = 90;
      ctaConversion = 85;
    } else if (username.includes("ishansharma")) {
      postingFreq = 95;
      hookStrength = 75;
      ctaConversion = 80;
    } else if (username.includes("rajshamani")) {
      postingFreq = 85;
      hookStrength = 100;
      ctaConversion = 90;
    } else if (username.includes("growthschoolio")) {
      postingFreq = 90;
      hookStrength = 92;
      ctaConversion = 95;
    } else {
      // Dynamic deterministic seeds based on username
      const sumCodes = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      postingFreq = 50 + (sumCodes % 40);
      hookStrength = 60 + (sumCodes % 35);
      ctaConversion = 55 + (sumCodes % 40);
    }

    // Wrap metrics
    return {
      avgLikesNumeric: likesVal,
      avgEngagement: Math.round(avgEngagement),
      postingFrequency: postingFreq,
      videoDuration: videoDuration,
      hookStrength: hookStrength,
      ctaConversion: ctaConversion
    };
  };

  // Filtered Competitors by active status and active Group Tab
  const activeCompetitors = useMemo(() => {
    return competitors.filter(comp => {
      // Must be active
      if (comp.status !== "Active") return false;
      // Tab group filter
      if (activeGroupTab === "All") return true;
      const compGroup = competitorGroups[comp.id] || "Primary Rivals";
      return compGroup === activeGroupTab;
    });
  }, [competitors, activeGroupTab, competitorGroups]);

  // Construct chart dataset for 'Avg Engagement/Likes' (Bar Chart)
  const barChartData = useMemo(() => {
    return activeCompetitors.map(comp => {
      const stats = getCompetitorRadarMetrics(comp);
      return {
        name: comp.name,
        handle: `@${comp.username}`,
        likes: stats.avgLikesNumeric,
        likesDisplay: comp.likes || "0 avg",
        engagementScore: stats.avgEngagement
      };
    });
  }, [activeCompetitors]);

  // Construct chart dataset for dimensions radar comparisons
  // Recharts radar chart requires structured fields side-by-side per competitor
  const radarChartData = useMemo(() => {
    const dimensions = [
      { subject: "Avg Engagement", key: "avgEngagement", fullMark: 100 },
      { subject: "Posting Freq", key: "postingFrequency", fullMark: 100 },
      { subject: "Video Duration Plan", key: "videoDurationScore", fullMark: 100 }, // Duration normalized score (60s = 100)
      { subject: "Hook Strength", key: "hookStrength", fullMark: 100 },
      { subject: "CTA Conversion Rate", key: "ctaConversion", fullMark: 100 }
    ];

    return dimensions.map(dim => {
      const result: Record<string, any> = {
        subject: dim.subject,
        fullMark: dim.fullMark
      };

      // Add metrics for each active competitor
      activeCompetitors.forEach(comp => {
        const stats = getCompetitorRadarMetrics(comp);
        let val = 50;
        if (dim.key === "videoDurationScore") {
          // Normalize duration: 60s -> 100, 30s -> 50, 90s -> 80
          const dur = stats.videoDuration;
          val = dur >= 60 ? Math.round(100 - (dur - 60) * 0.5) : Math.round((dur / 60) * 100);
        } else {
          val = stats[dim.key as keyof typeof stats] as number;
        }

        // Use competitor ID as key to guarantee unique reference in radar overlay
        result[`comp_${comp.id}`] = val;
        result[`comp_name_${comp.id}`] = comp.name;
      });

      return result;
    });
  }, [activeCompetitors]);

  // Toggle selection for comparison mode
  const handleToggleCompareSelect = (id: string) => {
    if (comparedCompIds.includes(id)) {
      if (comparedCompIds.length <= 1) {
        showToast("Please keep at least 1 competitor selected for comparisons.", "info");
        return;
      }
      setComparedCompIds(comparedCompIds.filter(cid => cid !== id));
    } else {
      if (comparedCompIds.length >= 3) {
        showToast("Maximum of 3 competitors can be compared side-by-side.", "info");
        return;
      }
      setComparedCompIds([...comparedCompIds, id]);
    }
  };

  // Real-time Event Simulator triggers
  const handleTriggerMilestoneAlert = () => {
    const randomComps = competitors.filter(c => c.status === "Active");
    if (randomComps.length === 0) return;
    const chosen = randomComps[Math.floor(Math.random() * randomComps.length)];
    
    const milestoneMsgs = [
      "just scaled their performance benchmark by 25% with their trending Hinglish case-study release!",
      "reached a historical milestone of 800K Reels video views on their latest design asset post! 🏆",
      "broke their record with 1,200 comment responses asking for direct PDF resources links! 📬",
      "spiked dynamic CTA conversion to an estimated 94% using clean commentautomation links!"
    ];
    const pickedMsg = milestoneMsgs[Math.floor(Math.random() * milestoneMsgs.length)];

    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    const newAlert: SimulatedNotification = {
      id: "sim-" + Date.now(),
      timestamp: timeStr,
      competitorName: chosen.name,
      username: chosen.username,
      platform: chosen.platform,
      type: "milestone",
      message: `${pickedMsg}`,
      badgeText: "MILESTONE HIT",
      isRead: false
    };

    setNotifications(prev => [newAlert, ...prev]);
    setNotificationBellCount(prev => prev + 1);
    showToast(`🔔 COMP_METRICS_ALARM: @${chosen.username} reached a new milestone!`, "success");
  };

  const handleTriggerNewPostAlert = () => {
    const randomComps = competitors.filter(c => c.status === "Active");
    if (randomComps.length === 0) return;
    const chosen = randomComps[Math.floor(Math.random() * randomComps.length)];

    const hookTopics = [
      "3 Secrets to scale your Vibe Coding setup without manual debugging grids!",
      "How I made my CAD sketches look perfectly lit under Unreal Engine 5.5 path-tracing!",
      "Stop pitching raw resume links. Try this 1-slide cold-pitch blueprint instead!",
      "This simple 2 AM workflow saved me 25 hours of creative burnout this week!"
    ];
    const pickedTopic = hookTopics[Math.floor(Math.random() * hookTopics.length)];

    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    const newAlert: SimulatedNotification = {
      id: "sim-" + Date.now(),
      timestamp: timeStr,
      competitorName: chosen.name,
      username: chosen.username,
      platform: chosen.platform,
      type: "post",
      message: `published a highly viral raw loop sequence: "${pickedTopic}" 🚨`,
      badgeText: "NEW CONCIPT POSTED",
      isRead: false
    };

    setNotifications(prev => [newAlert, ...prev]);
    setNotificationBellCount(prev => prev + 1);
    showToast(`🔔 COMP_CRAWLER_ALERT: @${chosen.username} posted a new content!`, "info");
  };

  // Run the background simulator interval to emulate real-time organic flow
  useEffect(() => {
    const orgInterval = setInterval(() => {
      // 30% chance of milestone alert, 70% chance of new post alert, every 50 seconds
      if (Math.random() > 0.6) {
        if (Math.random() > 0.6) {
          handleTriggerMilestoneAlert();
        } else {
          handleTriggerNewPostAlert();
        }
      }
    }, 50000);

    return () => clearInterval(orgInterval);
  }, [competitors]);

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setNotificationBellCount(0);
    showToast("Notifications cleared successfully.", "info");
  };

  // Palettes of colors for multi-tenant radar overlays
  const radarColors = [
    { stroke: "#00F0FF", fill: "#00F0FF", glow: "rgba(0, 240, 255, 0.15)" },
    { stroke: "#FFB800", fill: "#FFB800", glow: "rgba(255, 184, 0, 0.15)" },
    { stroke: "#39FF14", fill: "#39FF14", glow: "rgba(57, 255, 20, 0.15)" },
    { stroke: "#FF6B35", fill: "#FF6B35", glow: "rgba(255, 107, 53, 0.15)" }
  ];

  return (
    <div className="space-y-10 animate-fade-in" id="competitor-analysis-view">
      
      {/* 1. VIEW HEADER */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 sm:p-7 rounded-2xl border relative overflow-hidden gap-4 transition-all duration-300 ${
        isDarkMode 
          ? "border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent shadow-cyan-500/5" 
          : "border-black/5 bg-gradient-to-r from-black/[0.01] to-transparent shadow-sm"
      }`}>
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl bg-cyan-500/5 pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-black uppercase tracking-widest text-[#00F0FF] font-mono">
            <TrendingUp className="w-4 h-4 text-[#00F0FF]" /> Deep Analytics Engine
          </div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Competitor Intelligence & Performance Lab
          </h2>
          <p className={`text-xs mt-1 max-w-xl ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
            Reorganize competitors dynamically. Compare underlying video pillars, extraction metrics, conversion triggers, and track real-time milestone events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-6 max-w-xs shrink-0 font-mono">
          <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Crawl Hub: Synced
          </div>
          <div className={`text-[10px] text-xs ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
            COMPETITORS ON TRACK: {competitors.filter(c => c.status === "Active").length}
          </div>
        </div>
      </div>

      {/* 2. REALTIME ALERTS AND TESTING PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Real-time alerts notification container */}
        <div className={`col-span-1 lg:col-span-7 p-6 sm:p-7 rounded-2xl border flex flex-col gap-6 relative overflow-hidden transition-all duration-300 ${isDarkMode ? "bg-[#0E0E0E] border-white/10" : "bg-white border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"}`}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-red-500/5 pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-5 h-5 text-[#F97316]" />
                {notificationBellCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                    {notificationBellCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 font-mono ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Real-time Alerts & Milestone Feed
                </h3>
                <p className={`text-[10px] mt-0.5 transition-colors duration-300 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                  Organic platform crawls showing trending achievements and post triggers
                </p>
              </div>
            </div>

            {notifications.some(n => !n.isRead) && (
              <button
                onClick={markAllNotificationsAsRead}
                className={`text-[10px] font-mono transition-colors border p-1.5 rounded-md bg-transparent cursor-pointer ${
                  isDarkMode 
                    ? "text-white/40 hover:text-[#00F0FF] border-white/10 hover:bg-white/5" 
                    : "text-gray-500 hover:text-gray-900 border-black/10 hover:bg-black/5"
                }`}
              >
                Mark Cleared
              </button>
            )}
          </div>

          {/* Interactive alert log body */}
          <div className="space-y-3.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1.5">
            <AnimatePresence initial={false}>
              {notifications.length === 0 ? (
                <div className={`py-12 text-center text-xs italic ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
                  No alerts triggered yet. Click one of the simulation triggers on the right to test!
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -15, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs transition-all relative overflow-hidden ${
                      notif.isRead 
                        ? isDarkMode ? "bg-white/[0.01] border-white/5 opacity-55" : "bg-gray-50 border-gray-150 opacity-60"
                        : notif.type === "milestone"
                          ? isDarkMode ? "bg-amber-500/[0.04] border-amber-500/20" : "bg-amber-50/50 border-amber-200"
                          : isDarkMode ? "bg-cyan-500/[0.04] border-cyan-500/20" : "bg-cyan-50/50 border-cyan-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                          notif.type === "milestone"
                            ? "bg-amber-400/10 text-amber-500 border border-amber-500/20"
                            : "bg-cyan-400/10 text-cyan-600 border border-cyan-500/20"
                        }`}>
                          {notif.badgeText}
                        </span>
                        <span className={`font-semibold ${isDarkMode ? "text-white/80" : "text-gray-900"}`}>{notif.competitorName}</span>
                        <span className={`font-mono text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>@{notif.username}</span>
                      </div>
                      <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>{notif.timestamp}</span>
                    </div>

                    <p className={`leading-relaxed text-xs pl-0.5 ${isDarkMode ? "text-white/70" : "text-gray-800"}`}>
                      <span className={`font-mono text-[10px] uppercase mr-1 inline-flex items-center gap-0.5 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>[{notif.platform}]</span>
                      {notif.message}
                    </p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Real-time system simulation triggers and calibration */}
        <div className={`col-span-1 lg:col-span-12 xl:col-span-5 p-6 sm:p-7 rounded-2xl border flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${isDarkMode ? "bg-[#0E0E0E] border-white/10" : "bg-white border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"}`}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-[#00F0FF]/5 pointer-events-none" />
          
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00F0FF] flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4 text-[#00F0FF]" /> Event Simulator Suite
            </h3>
            <p className={`text-[10px] mt-0.5 transition-colors duration-300 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
              Test the custom real-time notification engine on demand. Alerts will slide dynamically into the dashboard active logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
            <button
              onClick={handleTriggerNewPostAlert}
              className="py-3 px-4 rounded-xl bg-cyan-700/10 hover:bg-cyan-700/20 border border-cyan-500/20 hover:border-cyan-500/50 text-[#00F0FF] text-xs font-mono font-bold tracking-wider hover:scale-[1.01] transition-all cursor-pointer active:scale-95 flex flex-col justify-center items-center text-center gap-1"
            >
              <Video className="w-4.5 h-4.5 shrink-0" />
              <span>CRAWL COGNITIVE POST</span>
              <span className={`text-[8px] font-normal ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Spawn fresh competitor concept</span>
            </button>
            <button
              onClick={handleTriggerMilestoneAlert}
              className="py-3 px-4 rounded-xl bg-amber-700/10 hover:bg-amber-700/20 border border-amber-500/20 hover:border-amber-500/50 text-amber-400 text-xs font-mono font-bold tracking-wider hover:scale-[1.01] transition-all cursor-pointer active:scale-95 flex flex-col justify-center items-center text-center gap-1"
            >
              <Award className="w-4.5 h-4.5 shrink-0" />
              <span>SIMULATE BREAKTHROUGH</span>
              <span className={`text-[8px] font-normal ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Force milestone spikes metrics</span>
            </button>
          </div>

          <div className={`pt-3 text-[10px] italic leading-normal flex items-start gap-1.5 border-t ${isDarkMode ? "border-white/5 text-white/30" : "border-black/5 text-gray-500"}`}>
            <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDarkMode ? "text-white/30" : "text-gray-400"}`} />
            <span>Organic backdrop timers are armed to automatically trigger simulated events in the background every 50 seconds during your research exploration.</span>
          </div>
        </div>

      </div>

      {/* 3. GROUP TABS & VISUALIZATION SUMMARY */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${isDarkMode ? "bg-[#0E0E0E] border-white/10" : "bg-white border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"}`}>
        
        {/* Dynamic Groups filter & Dashboard Tabs */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between border-b pb-5 mb-7 gap-4 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
          <div>
            <span className={`text-[9px] font-mono tracking-widest uppercase ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>ORGANIZATIONAL LAB</span>
            <h3 className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Competitor Segmentation</h3>
            <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-white/45" : "text-gray-500"}`}>Filter charts and overview matrices by custom tracked lists.</p>
          </div>

          <div className={`flex flex-wrap p-1 rounded-xl gap-1 ${isDarkMode ? "bg-white/[0.02] border border-white/5" : "bg-black/[0.02] border border-black/5"}`}>
            {(["All", "Primary Rivals", "Emerging Threats", "Niche Inspiration"] as const).map((gTab) => {
              const isActive = activeGroupTab === gTab;
              return (
                <button
                  key={gTab}
                  onClick={() => {
                    setActiveGroupTab(gTab);
                    showToast(`Filtered dashboard to - ${gTab}`, "info");
                  }}
                  className={`rounded-lg px-3.5 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all w-full sm:w-auto text-center ${
                    isActive
                      ? "bg-[#00F0FF] text-black font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                      : isDarkMode 
                        ? "text-white/60 hover:text-white hover:bg-white/5" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-black/5"
                  }`}
                >
                  {gTab === "All" ? "ALL SYSTEMS" : gTab}
                </button>
              );
            })}
          </div>
        </div>

        {/* If no active competitors match active group, render empty states gracefully */}
        {activeCompetitors.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className={`w-8 h-8 ${isDarkMode ? "text-white/30" : "text-gray-400"}`} />
            <h4 className={`text-sm font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}>No active competitors inside filter segment</h4>
            <p className={`text-xs max-w-sm ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
              Use the sliders below or the custom competitors overview list to categorize your active tracked accounts into this group tag!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* WIDGET A: Avg Engagement / Likes Summary comparison (Requirement 1 & Bar Chart) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <BarChart3 className="w-4 h-4 text-[#00F0FF]" /> Avg Engagement / Likes Comparison
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                    Comparative likes value and engagement indices parsed from recent crawls
                  </p>
                </div>
                <span className="text-[9px] font-mono text-[#00F0FF] border border-[#00F0FF]/25 bg-[#00F0FF]/5 px-2 py-0.5 rounded">
                  BAR PROFILE
                </span>
              </div>

              <div className={`h-[280px] w-full border rounded-xl p-4 flex items-center justify-center ${isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-black/[0.01] border-black/5"}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#222" : "#e5e5e5"} />
                    <XAxis 
                      dataKey="name" 
                      stroke={isDarkMode ? "#444" : "#888"} 
                      tick={{ fill: isDarkMode ? "#888" : "#555", fontSize: 9, fontWeight: "bold" }}
                    />
                    <YAxis 
                      stroke={isDarkMode ? "#444" : "#888"} 
                      tick={{ fill: isDarkMode ? "#888" : "#555", fontSize: 8 }}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`border p-3 rounded-xl text-xs space-y-1 font-mono shadow-md ${
                              isDarkMode ? "bg-[#0A0A0B] border-white/10 text-white" : "bg-white border-black/10 text-gray-900"
                            }`}>
                              <p className={`font-bold uppercase ${isDarkMode ? "text-white" : "text-gray-900"}`}>{data.name}</p>
                              <p className="text-[#00F0FF]">{data.handle}</p>
                              <div className={`border-t my-1.5 ${isDarkMode ? "border-white/5" : "border-black/5"}`} />
                              <p className={`${isDarkMode ? "text-white/80" : "text-gray-700"}`}>Avg Likes: <span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{data.likesDisplay}</span></p>
                              <p className={`${isDarkMode ? "text-white/80" : "text-gray-700"}`}>Engagement Score: <span className="text-[#39FF14] font-bold">{data.engagementScore}%</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="likes" 
                      fill="#00F0FF" 
                      radius={[4, 4, 0, 0]} 
                      name="Average likes score multiplier" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* WIDGET B: 5-dimensional Radar chart (Requirement 4) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> Multi-Dimensional Performance Radar
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                    Analyzing Avg engagement, Posting freq, Duration, Hook strength, & CTA converter
                  </p>
                </div>
                <span className="text-[9px] font-mono text-amber-400 border border-amber-400/25 bg-amber-400/5 px-2 py-0.5 rounded">
                  OVERLAY MAP
                </span>
              </div>

              <div className={`h-[280px] w-full border rounded-xl p-3 flex items-center justify-center ${isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-black/[0.01] border-black/5"}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                    <PolarGrid stroke={isDarkMode ? "#2e2e2e" : "#e5e5e5"} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: isDarkMode ? "#999" : "#444", fontSize: 8, fontWeight: "bold" }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: isDarkMode ? "#777" : "#555", fontSize: 7 }}
                    />
                    
                    {/* Render overlays for up to 4 active competitors in active group tab */}
                    {activeCompetitors.slice(0, 4).map((comp, groupIdx) => {
                      const colorScheme = radarColors[groupIdx % radarColors.length];
                      return (
                        <Radar
                           key={comp.id}
                           name={comp.name}
                           dataKey={`comp_${comp.id}`}
                           stroke={colorScheme.stroke}
                           fill={colorScheme.fill}
                           fillOpacity={0.12}
                        />
                      );
                    })}
                    
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 9, color: isDarkMode ? "#888" : "#555", fontWeight: "black", textTransform: "uppercase" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 4. COMPARISON MODE VIEW: Side-By-Side (Requirement 2) */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${isDarkMode ? "bg-[#0E0E0E] border-white/10" : "bg-white border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"}`}>
        
        <div className={`flex flex-col md:flex-row md:items-center justify-between border-b pb-5 mb-6 gap-4 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
          <div>
            <span className="text-[9px] font-mono tracking-widest uppercase text-purple-400 font-bold">MODE: DYNAMIC MATRICES</span>
            <h3 className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Competitors Side-By-Side Battle board</h3>
            <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-white/45" : "text-gray-500"}`}>Select any 2 to 3 competitors below to isolate and audit their primary content blueprints.</p>
          </div>

          {/* Quick interactive selector list of checkboxes */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-mono uppercase mr-1 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Track Selectors:</span>
            {competitors.filter(c => c.status === "Active").map(comp => {
              const isSelected = comparedCompIds.includes(comp.id);
              return (
                <button
                  key={comp.id}
                  onClick={() => handleToggleCompareSelect(comp.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? "bg-purple-500/10 border border-purple-500 text-purple-400"
                      : isDarkMode
                        ? "bg-white/[0.02] border border-white/10 text-white/50 hover:text-white"
                        : "bg-black/[0.02] border border-black/10 text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3 text-purple-400" /> : <Plus className={`w-3 h-3 ${isDarkMode ? "text-white/30" : "text-gray-400"}`} />}
                  {comp.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected comparison cards rendering container */}
        {(() => {
          const selectedComps = competitors.filter(c => comparedCompIds.includes(c.id));
          if (selectedComps.length === 0) {
            return (
              <div className={`py-12 text-center text-xs italic ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
                Activate competitor badges above to formulate a side-by-side battle board!
              </div>
            );
          }
          return (
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-xs border rounded-xl border-collapse ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                <thead>
                  <tr className={`border-b text-[9px] uppercase tracking-widest font-mono ${
                    isDarkMode ? "bg-white/[0.02] border-white/5 text-white/45" : "bg-black/[0.01] border-black/5 text-gray-500"
                  }`}>
                    <th scope="col" className={`p-4 border-r min-w-[140px] ${isDarkMode ? "border-white/5" : "border-black/5"}`}>Strategic Attribute</th>
                    {selectedComps.map(comp => (
                      <th scope="col" key={comp.id} className={`p-4 border-r min-w-[220px] ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-[#00F0FF] border uppercase ${
                            isDarkMode ? "bg-slate-800 border-white/10" : "bg-slate-900 border-black/10 shadow-xs"
                          }`}>
                            {comp.name.substring(0, 2)}
                          </span>
                          <div>
                            <p className={`font-bold text-xs ${isDarkMode ? "text-white" : "text-gray-900"}`}>{comp.name}</p>
                            <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>@{comp.username}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y font-sans ${
                  isDarkMode ? "divide-white/5 text-white/80" : "divide-black/5 text-gray-750"
                }`}>
                  
                  {/* Row 1: Handles and Platform Info */}
                  <tr className={`transition-colors ${isDarkMode ? "hover:bg-white/[0.01]" : "hover:bg-black/[0.01]"}`}>
                    <td className={`p-4 font-mono font-bold text-[10px] uppercase tracking-wider border-r ${
                      isDarkMode ? "text-white/40 bg-white/[0.01] border-white/5" : "text-gray-500 bg-gray-50/55 border-black/5"
                    }`}>Primary channel</td>
                    {selectedComps.map(comp => (
                      <td key={comp.id} className={`p-4 border-r ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                        <span className={`inline-flex px-2 py-1 rounded font-mono text-[9px] font-semibold ${
                          isDarkMode ? "bg-slate-900 border border-white/10 text-white/70" : "bg-gray-150 border border-black/10 text-gray-700"
                        }`}>
                          {comp.platform.toUpperCase()}
                        </span>
                        <a 
                          href={comp.profileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="ml-2 text-[10px] text-[#00F0FF] hover:underline inline-flex items-center gap-0.5 font-bold"
                        >
                          Launch Profile
                        </a>
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Baseline score comparison */}
                  <tr className={`transition-colors ${isDarkMode ? "hover:bg-white/[0.01]" : "hover:bg-black/[0.01]"}`}>
                    <td className={`p-4 font-mono font-bold text-[10px] uppercase tracking-wider border-r ${
                      isDarkMode ? "text-white/40 bg-white/[0.01] border-white/5" : "text-gray-500 bg-gray-50/55 border-black/5"
                    }`}>Avg likes scale</td>
                    {selectedComps.map(comp => (
                      <td key={comp.id} className={`p-4 border-r font-semibold text-xs ${
                        isDarkMode ? "border-white/5 text-white" : "border-black/5 text-gray-900"
                      }`}>
                        {comp.likes || "0 avg"}
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: Video Pillars (Niche / Content Focus focus, Duration) */}
                  <tr className={`transition-colors ${isDarkMode ? "hover:bg-white/[0.01]" : "hover:bg-black/[0.01]"}`}>
                    <td className={`p-4 font-mono font-bold text-[10px] uppercase tracking-wider border-r text-purple-400 ${
                      isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-gray-50/55 border-black/5"
                    }`}>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Video Pillars</span>
                      </div>
                    </td>
                    {selectedComps.map(comp => {
                      const stats = getCompetitorRadarMetrics(comp);
                      return (
                        <td key={comp.id} className={`p-4 border-r space-y-2 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                          <div>
                            <p className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Core Content Domain</p>
                            <p className={`text-xs leading-relaxed p-2.5 rounded-lg border ${
                              isDarkMode ? "bg-[#111] border-white/5 text-white/95" : "bg-gray-50 border-black/5 text-gray-900"
                            }`}>{comp.focus || "Creative strategy"}</p>
                          </div>
                          <div>
                            <p className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Video Duration Profile</p>
                            <p className={`text-xs font-semibold ${isDarkMode ? "text-white/80" : "text-gray-800"}`}>{stats.videoDuration} seconds average formats</p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 4: Engagement Triggers (Hook analysis, CTA conversions used) */}
                  <tr className={`transition-colors ${isDarkMode ? "hover:bg-white/[0.01]" : "hover:bg-black/[0.01]"}`}>
                    <td className={`p-4 font-mono font-bold text-[10px] uppercase tracking-wider border-r text-orange-400 ${
                      isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-gray-50/55 border-black/5"
                    }`}>
                      <div className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Engagement Triggers</span>
                      </div>
                    </td>
                    {selectedComps.map(comp => (
                      <td key={comp.id} className={`p-4 border-r space-y-2.5 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                        <div>
                          <p className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Scroll-stopping Hook line</p>
                          <p className={`text-xs leading-normal p-2.5 rounded-lg border italic ${
                            isDarkMode ? "bg-orange-950/10 border-orange-500/10 text-white/95" : "bg-orange-50 border-orange-200 text-gray-900"
                          }`}>
                            &ldquo;{comp.hook || "Dynamic hooks and pattern interrupts"}&rdquo;
                          </p>
                        </div>
                        <div>
                          <p className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-0.5 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>Automated CTA Call-to-action</p>
                          <p className={`text-xs leading-normal p-2.5 rounded-lg border font-mono ${
                            isDarkMode ? "bg-purple-950/10 border-purple-500/10 text-white/95" : "bg-purple-50 border-purple-200 text-gray-900"
                          }`}>
                            {comp.cta || "Comment 'GET' for resources link"}
                          </p>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Notes / Curated format insight details */}
                  <tr className={`transition-colors ${isDarkMode ? "hover:bg-white/[0.01]" : "hover:bg-black/[0.01]"}`}>
                    <td className={`p-4 font-mono font-bold text-[10px] uppercase tracking-wider border-r ${
                      isDarkMode ? "text-white/40 bg-white/[0.01] border-white/5" : "text-gray-500 bg-gray-50/55 border-black/5"
                    }`}>Format intelligence</td>
                    {selectedComps.map(comp => (
                      <td key={comp.id} className={`p-4 border-r leading-relaxed text-[11px] italic ${
                        isDarkMode ? "border-white/5 text-white/60" : "border-black/5 text-gray-650"
                      }`}>
                        {comp.notes || "No documentation logs registered."}
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* 5. INDIVIDUAL ALLOCATION MANAGER */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${isDarkMode ? "bg-[#0E0E0E] border-white/10" : "bg-white border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"}`}>
        <div>
          <span className={`text-[9px] font-mono tracking-widest uppercase ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>CONFIG GRID</span>
          <h3 className={`text-sm font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Tracked Competitor Group Alignment</h3>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
            Segment your active creators into focus buckets. Changes here immediately recalculate visual segments, tabs, and interactive overlays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {competitors.filter(c => c.status === "Active").map(comp => {
            const currentGroup = competitorGroups[comp.id] || "Primary Rivals";
            return (
              <div 
                key={comp.id} 
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3.5 ${
                  isDarkMode 
                    ? "border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10" 
                    : "border-black/5 bg-black/[0.01] hover:bg-black/[0.02] hover:border-black/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className={`font-bold text-xs ${isDarkMode ? "text-white" : "text-gray-900"}`}>{comp.name}</h4>
                    <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>@{comp.username}</p>
                  </div>
                  <span className={`text-[8px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${
                    currentGroup === "Primary Rivals"
                      ? "bg-red-400/10 text-red-500 border border-red-500/10"
                      : currentGroup === "Emerging Threats"
                        ? "bg-amber-400/10 text-amber-400 border border-amber-500/10"
                        : "bg-emerald-400/10 text-emerald-400 border border-emerald-500/10"
                  }`}>
                    {currentGroup}
                  </span>
                </div>

                <div className={`flex items-center justify-between border-t pt-3 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                  <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/30" : "text-gray-500"}`}>Move Category:</span>
                  <select
                    value={currentGroup}
                    onChange={(e) => handleMoveGroup(comp.id, e.target.value as GroupName)}
                    className={`font-sans text-[10px] rounded p-1 shadow-sm font-medium outline-none focus:border-[#00F0FF]/50 ${
                      isDarkMode 
                        ? "bg-[#111] border border-white/10 text-white" 
                        : "bg-white border border-black/10 text-gray-900"
                    }`}
                  >
                    <option value="Primary Rivals">Primary Rivals</option>
                    <option value="Emerging Threats">Emerging Threats</option>
                    <option value="Niche Inspiration">Niche Inspiration</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
