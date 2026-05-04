export function getPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function montarLinkAgendamento(slugEmpresa: string) {
  const baseUrl = getPublicBaseUrl();

  return `${baseUrl}/agendar/${slugEmpresa}`;
}