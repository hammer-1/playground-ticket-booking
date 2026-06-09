/** Socket.io room shared by everyone viewing the same pitch on the same date. */
export function pitchDateRoom(pitchId: string, date: string): string {
  return `pitch:${pitchId}:${date}`;
}
