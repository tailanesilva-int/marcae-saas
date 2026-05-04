export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarScheduler } = await import('./app/lib/lembretesScheduler');

    iniciarScheduler();
  }
}