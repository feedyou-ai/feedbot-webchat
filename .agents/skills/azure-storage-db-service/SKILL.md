---
name: azure-storage-db-service
description: Feedbot Azure Table Storage and Azure Blob Storage domain patterns. Use when working with storage layers, dbService directories, entities, domain-object mapping, Azure table/blob persistence, BotConfiguration storage, or server/node-sdk persistence code.
---

# Azure Storage DbService

## Overview

Feedbot uses Azure Table Storage as a database. Because Azure Table Storage has strict column-size limits, Azure Blob Storage is used for larger per-row data that may not fit into a table column.

Database access goes through the `storage` singleton, a custom layer built on top of `@azure/data-tables` and `@azure/storage-blob`. The storage singleton lives under `packages/utils/src/azurestorage/nextGen/storageManager`.

## Structure

Each feature or plugin responsible for database tables should define its own storage layer under a `/dbService` directory.

## Guidelines

- Each table should have a corresponding TypeScript type named `<Thing>Entity`, for example `BotEntity`, describing a single table row.
- Treat entity shape as an implementation detail of the database layer. Keep it inside the relevant `/dbService` directory, except for the shared `storage` singleton.
- Expose domain objects from `/dbService` to the rest of the application instead of exposing entities directly.
- Most domain objects map 1:1 to entities, but some domain objects may transform shape or combine data from multiple tables.

## File Structure

Use this structure for a `/dbService` layer:

- `types.ts`: entity, domain object, and related database-layer types.
- `mapService.ts`: mapper functions between entities and domain objects.
- `actions/<action_name>.ts`: operations over domain objects, such as `createBot.ts`, `archiveBot.ts`, or `adoptVersionFromDifferentBot.ts`.
- `utils/<utility_name>.ts`: shared utilities for the rest of the `/dbService` layer.

Name mapper functions using the `entityToDomainObject` and `domainObjectToEntity` pattern, for example `entityToBot` and `botToEntity`. Add patch helpers when an action needs to create a partial update for an entity.

Domain actions may import sibling actions and usually resolve to CRUD operations over underlying entities through the mapper functions.
