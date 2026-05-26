import { LinkType } from "@/types/linkVault";

export function detectLinkType(url: string): LinkType {
  const u = url.toLowerCase();

  // YouTube Shorts, Videos, channels
  if (u.includes('youtube.com/shorts/') || u.includes('youtu.be/shorts/')) {
    return 'youtube-short';
  }
  if (u.includes('youtube.com/watch') || u.includes('youtu.be/') || u.includes('youtube.com/embed/')) {
    return 'youtube-video';
  }
  if (
    u.includes('youtube.com/@') ||
    u.includes('youtube.com/channel/') ||
    u.includes('youtube.com/c/') ||
    u.includes('youtube.com/user/')
  ) {
    return 'youtube-channel';
  }

  // Instagram Reels, Posts, profile page
  if (u.includes('instagram.com/reel/') || u.includes('instagram.com/reels/')) {
    return 'instagram-reel';
  }
  if (u.includes('instagram.com/p/')) {
    return 'instagram-post';
  }
  if (u.match(/instagram\.com\/[^/]+\/?$/) || u.includes('instagram.com/profile')) {
    return 'instagram-profile';
  }

  // Reddit Comments Thread, posts
  if (u.includes('reddit.com/r/') && u.includes('/comments/')) {
    return 'reddit-thread';
  }
  if (u.includes('reddit.com/r/')) {
    return 'reddit-post';
  }

  // Newsletters
  if (u.includes('substack.com')) {
    return 'substack';
  }
  if (u.includes('beehiiv.com') || u.includes('mailchimp.com')) {
    return 'newsletter';
  }

  // Twitter / X
  if (u.includes('twitter.com') || u.includes('x.com')) {
    return 'twitter-post';
  }

  // LinkedIn
  if (u.includes('linkedin.com')) {
    return 'linkedin-post';
  }

  // PDF
  if (u.endsWith('.pdf') || u.includes('/pdf/')) {
    return 'pdf';
  }

  return 'unknown';
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/shorts\/([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function parseUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s\n\r,]+/gi;
  const matches = text.match(urlRegex) || [];
  // Deduplicate
  return [...new Set(matches)]
    .map(url => url.trim())
    .filter(url => url.length > 10)
    .slice(0, 500); // hard cap at 500 links
}
