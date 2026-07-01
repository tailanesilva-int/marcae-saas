'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');
    const usuarioStorage = localStorage.getItem('usuarioEmpresa');

    if (empresaStorage && usuarioStorage) {
      window.location.href = '/dashboard';
      return;
    }

    window.location.href = '/login';
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(160deg, #080B16 0%, #111827 55%, #1e1b4b 100%)',
        color: '#fff',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <section>
        <img
          src="/icons/icon-192.png"
          alt="Marcaê"
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            marginBottom: 18,
          }}
        />

        <h1 style={{ margin: 0, fontSize: 32 }}>Marcaê</h1>

        <p style={{ marginTop: 8, color: '#cbd5e1' }}>
          Preparando seu acesso...
        </p>
      </section>
    </main>
  );
}