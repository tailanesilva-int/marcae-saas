import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

export default async function EmpresaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const empresa = await prisma.empresa.findFirst({
    where: {
      slug,
      ativo: true,
    },
    select: {
      slug: true,
    },
  });

  if (!empresa) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Empresa não encontrada</h1>
        <p>Verifique se o link está correto ou se a empresa está ativa.</p>
      </main>
    );
  }

  redirect(`/login?empresa=${empresa.slug}`);
}