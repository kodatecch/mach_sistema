# Diretrizes de Prompts de Implementação - STEM Racing

> [!IMPORTANT]
> **Contexto de Domínio**: O "carro" neste sistema é um carrinho miniatura movido a cartucho de CO2 (formato STEM Racing / F1 in Schools), não um veículo real. Todas as tarefas de fabricação referem-se a processos como usinagem CNC de blocos de modelagem de poliuretano/ABS, prototipagem 3D FDM/SLA, e montagem de rodas/eixos em miniatura. As vistorias técnicas referem-se ao processo oficial de Scrutineering da competição.

## 1. Contexto para Geração de Código
Ao solicitar alterações ou novas implementações para os módulos de Cronograma, Finanças, Riscos ou Stakeholders, garanta que os prompts comecem com a seguinte instrução:

```text
Você é um desenvolvedor trabalhando no sistema Mach Control para uma equipe de F1 in Schools (STEM Racing).
O projeto consiste em gerenciar o desenvolvimento de um protótipo de carrinho em miniatura (~1:20), esculpido por fresadoras CNC de mesa de precisão ou impresso em 3D, movido pela liberação rápida de gás de um cartucho de CO2.
O orçamento é voltado para filamentos de impressão, blocos de modelagem (ABS/PU), cartuchos de CO2, taxas de inscrição e custos de montagem de estandes (Pit Display).
```

## 2. Exemplos de Prompt de Refinamento
Use prompts como:
- *"Adicione um validador físico que verifique se a estimativa de peso inserida na WBS de materiais não viola o peso mínimo definido no regulamento ativo (regulation_rules.weight_limit_g)."*
- *"Gere cotações padrão para suprimentos de F1 in Schools no módulo de Orçamento."*
