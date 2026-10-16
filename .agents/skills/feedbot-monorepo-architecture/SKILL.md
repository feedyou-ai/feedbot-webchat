---
name: feedbot-monorepo-architecture
description: Feedbot monorepo architecture and package dependency context. Use when reasoning about cross-package changes, schema/utils blast radius, Designer/Server/Node SDK/Azure WebApp data flow, deployment architecture, or which package owns a Feedbot behavior.
---

# Feedbot Monorepo Architecture

## Overview

Feedbot is a Lerna monorepo for creating, configuring, deploying, and testing chatbots and voice bots. It is built on Microsoft BotBuilder v3. Every chat or voice bot is represented as JSON configuration that can be modified in Designer. Bots are deployed as Azure Web Apps. All packages are written in TypeScript.

## Core Packages

- `packages/designer`: React SPA for visual bot creation and design. Allows non-technical users to define, configure, and deploy bots.
- `packages/server`: Express backend API for Designer. Handles bot persistence, deployment management, real-time collaboration, and related backend behavior.
- `packages/node-sdk`: BotBuilder wrapper that converts Designer JSON configs into executable dialogs.
- `packages/azure-webapp`: Azure Web App deployment template for hosting bot instances. Wraps Node SDK and hosts a single bot defined by JSON configuration.
- `packages/azure-function`: deprecated legacy Function App deployment template; ignore this package unless the task explicitly concerns legacy function behavior.
- `packages/schema`: JSON Schema definitions and generated TypeScript types for bot configurations. Schemas and types are shared by all other packages.
- `packages/utils`: shared TypeScript types and utilities.
- `packages/e2e-tests`: Cypress-based end-to-end tests for Designer and Server.

## Data Flow

1. `packages/schema` defines the bot JSON schema shape.
2. `packages/designer` creates and modifies JSON configs for individual bots.
3. `packages/server` persists configs and initiates deployment.
4. `packages/azure-webapp` wraps and runs `packages/node-sdk` inside an Azure Web App and exposes the public bot API.
5. `packages/node-sdk` runs the BotBuilder dialog logic.

## Deployment Architecture

- CI/CD runs through Azure DevOps pipelines in `azure-pipelines.*.yml`.
- Lerna handles semantic versioning across packages.
- Packages are distributed through a private GitHub Packages registry.

When working on this codebase, account for distributed impact. Changes in `schema` or `utils` affect both Designer and runtime packages, while Node SDK changes impact all deployment targets.
