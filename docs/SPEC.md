# Especificação Técnica do Sistema - STEM Racing (F1 in Schools)

> [!NOTE]
> **Nota de Contexto**: O "carro" neste sistema refere-se a um modelo em miniatura (escala aproximada de 1:20) movido por cartuchos descartáveis de CO2 de 8g, usinado CNC a partir de um bloco de material de modelagem (como ABS ou poliuretano) ou impresso em 3D. O veículo compete em uma pista reta de 20 metros cronometrada eletronicamente e deve obedecer estritamente às regras de dimensões e peso regulamentados.

## 1. Escopo & Domínio Técnico
A plataforma é desenhada para a gestão e otimização dos projetos de desenvolvimento do carrinho miniatura da equipe Mach Racing. O julgamento oficial e avaliação dividem-se em 6 frentes centrais da competição:

1. **Engineering Portfolio**: Projetagem mecânica do chassi miniatura, aerodinâmica (CFD), fabricação/usinagem de bloco ABS e gerenciamento físico de cronograma/caminho crítico (WBS/CPM).
2. **Enterprise Portfolio**: Plano de negócios, captação de recursos com patrocinadores e orçamento total (Fluxo de Caixa / Contingência).
3. **Social Development / Sustainability Portfolio**: Impacto ambiental, reutilização de filamentos, neutralização de emissões de CO2 e projetos sociais de incentivo STEM.
4. **Verbal Presentation**: Pitch oral para avaliação da banca de juízes.
5. **Pit Display**: Montagem física do estande/booth da escuderia e atendimento corporativo.
6. **Team Identity**: Uniformes oficiais, logo, marca e presença digital da equipe.

## 2. Parâmetros de Regulamento Técnico (`regulation_rules`)
Para evitar valores fixos na interface ou no código que possam se tornar obsoletos entre temporadas, os parâmetros de conformidade técnica são mantidos em banco de dados:
- `weight_limit_g`: Limite de peso mínimo do carrinho (ex.: 50.0g) regulamentado.
- `length_limit_mm`: Comprimento total do dragster (ex.: 170mm a 210mm).
- `width_limit_mm`: Largura máxima permitida com as rodas montadas (ex.: 65.0mm).
- `co2_canister_g`: Especificação oficial da massa do cartucho de gás carbônico (ex.: 8g).

## 3. Avaliação de Performance (Mach Wheel Scores)
O radar de maturidade técnico-administrativa (Mach Wheel) no dashboard inicial compara os scores da temporada atual versus anterior (escala 1 a 10) nas 6 frentes de avaliação oficial, permitindo visualizar de forma imediata o progresso da equipe em direção ao pódio.
