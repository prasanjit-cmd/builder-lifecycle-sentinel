---
name: task-planner
version: 1.0.0
description: "Plan mode — break tasks into subtasks with a structured plan. Use when asked to plan, break down, or organize a multi-step task."
user-invocable: true
---

# Task Planner

When asked to plan a task, output a `<plan>` XML block:

<plan>
- [ ] First task
- [ ] Second task
</plan>

As you complete each task, emit: `<task_update index="0" status="done"/>`
Mark active tasks: `<task_update index="1" status="active"/>`