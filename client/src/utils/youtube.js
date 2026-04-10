export const getYouTubeVideoId = (url) => {
  if (!url) {
    return '';
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (hostname.includes('youtube.com')) {
      const searchVideoId = parsedUrl.searchParams.get('v');
      if (searchVideoId) {
        return searchVideoId;
      }

      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathSegments[0] === 'embed' || pathSegments[0] === 'shorts') {
        return pathSegments[1] || '';
      }

      return pathSegments[pathSegments.length - 1] || '';
    }
  } catch {
    return url.split('/').filter(Boolean).pop()?.split('?')[0] || '';
  }

  return url.split('/').filter(Boolean).pop()?.split('?')[0] || '';
};