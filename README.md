# InVoiced

Gestão de faturas com IA para PMEs portuguesas.  
Construído com React + Vite + TypeScript.

## Funcionalidades

- Faturas de fornecedores e clientes
- Pastas com auto-classificação por IA
- Reconciliação bancária (Excel, CSV, PDF)
- Assistente de cash flow com IA
- Exportação PDF e resumo mensal
- Dark / Light mode

## Instalação

```bash
npm install
npm run dev
```

## Estrutura

```
src/
  lib/
    storage.ts        # wrapper window.storage (Claude artifact runtime)
    files.ts          # gestão de ficheiros em memória
    utils.ts          # formatação, datas, NIF
    constants.ts      # estados, cores, ícones
    theme.ts          # sistema de cores dark/light
    folderMatcher.ts  # auto-associação de faturas a pastas
  components/
    ui/               # componentes base reutilizáveis
    invoices/         # componentes específicos de faturas
  App.tsx
  InVoiced.tsx        # componente principal (monolítico, a refatorar)
  main.tsx
```

## Nota

`src/InVoiced.tsx` contém o componente principal ainda monolítico.  
Os módulos em `src/lib/` e `src/components/` são a base para refatoração progressiva.
