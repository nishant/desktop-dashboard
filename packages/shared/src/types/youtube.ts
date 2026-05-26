export interface YoutubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export interface YoutubeSearchPage {
  items: YoutubeVideo[];
  nextPageToken: string | null;
}
