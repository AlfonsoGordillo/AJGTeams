// Helper to generate the exact meeting link for participants
export function getPublicMeetingUrl(roomId: string): string {
  const origin = window.location.origin;
  return `${origin}/?room=${encodeURIComponent(roomId)}`;
}
