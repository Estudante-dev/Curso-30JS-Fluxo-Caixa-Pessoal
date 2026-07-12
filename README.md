# Curso-30JS-Fluxo-Caixa-Pessoal

Projeto **Fluxo de Caixa Pessoal** do [#30ProjetosJavaScript](https://github.com/topics/30projetosjavascript).

Aplicação de controle financeiro pessoal com HTML5, CSS3 e JavaScript Vanilla: cadastro de receitas e despesas, categorias, saldo dinâmico, filtros em tempo real e persistência via `localStorage`.

## Como usar

Abra o arquivo `index.html` no navegador (duplo clique ou servidor local).

## Funcionalidades

- Painel com total de entradas, saídas e saldo atual
- Formulário de movimentações (descrição, valor, tipo e categoria)
- Histórico com exclusão por delegação de eventos (`data-id`)
- Busca por descrição e filtros (Todas / Receitas / Despesas)
- Persistência completa no `localStorage`
- Gráfico de rosca (CSS `conic-gradient`) com alerta acima de 75% de gastos

## Estrutura

```
├── index.html
├── css/
│   └── styles.css
└── js/
    └── script.js
```
