
# PRD - FocusFlow (v2: Agendamento e Metas)

## 1. Visão Geral
O **FocusFlow** evolui de um simples Kanban para um sistema de gestão de compromissos. Agora, separamos a **Existência** da tarefa (Backlog/Deadline) da sua **Execução** (Agenda).

## 2. Novos Objetivos
- Gerenciar prazos fatais (Deadlines).
- Planejar blocos de tempo específicos para trabalho (Time Blocking).
- Identificar desvios entre o planejado na agenda e a execução real.

## 3. Funcionalidades Detalhadas (v2)

### 3.1. Metas e Prazos
- Cada tarefa pode ter uma data de entrega final.
- Alertas visuais para tarefas próximas do prazo ou atrasadas.

### 3.2. Agenda de Execução (Time Blocking)
- Possibilidade de adicionar múltiplos "slots" de tempo para uma única tarefa.
- Exemplo: "Trabalhar no Projeto X" na Segunda das 14h às 16h e na Quarta das 10h às 12h.

### 3.3. Monitoramento de Disciplina
- O Timer agora indica se você está trabalhando dentro do horário agendado.
- "Modo Fora da Agenda": Registro de sessões espontâneas vs. sessões planejadas.

## 4. Regras de Negócio Atualizadas
- **RN04**: Uma tarefa sem slots agendados permanece no "Backlog" mental, mas pode ser executada a qualquer momento.
- **RN05**: O sistema deve priorizar visualmente tarefas que possuem slots agendados para "Hoje".
