export async function alertOps(payload: {
  channel: string;
  message: string;
}): Promise<void> {
  console.warn(`[Governance Alert:${payload.channel}] ${payload.message}`);
}
