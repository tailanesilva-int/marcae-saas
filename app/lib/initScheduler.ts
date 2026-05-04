import { iniciarScheduler } from './lembretesScheduler';

declare global {
  var schedulerIniciado: boolean | undefined;
}

if (!global.schedulerIniciado) {
  console.log('🚀 Iniciando scheduler global...');
  iniciarScheduler();
  global.schedulerIniciado = true;
}