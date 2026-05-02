# 🛡️ TEOS Sentinel Shield

## Execution Control Infrastructure for Autonomous AI

### Generate → Validate → Execute

[![CI](https://github.com/Elmahrosa/teos-sentinel-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/Elmahrosa/teos-sentinel-shield/actions/workflows/ci.yml)
[![License: TESL](https://img.shields.io/badge/License-TESL-gold)](./LICENSE)
[![Live](https://img.shields.io/badge/Live-teos--sentinel--shield.vercel.app-blue)](https://teos-sentinel-shield.vercel.app)

---

## Overview

TEOS Sentinel Shield is an **execution control layer for autonomous systems**.

It analyzes and validates AI-generated:

* Code
* Dependencies
* CI/CD workflows

before execution, producing deterministic policy decisions:

* ✅ **ALLOW**
* ⚠️ **WARN**
* 🚫 **BLOCK**

Each decision is explainable and rule-driven.

---

## Problem

Modern AI systems increasingly generate executable output.

But most workflows still follow:

```text
Generate → Execute
```

This creates direct risk exposure in:

* CI pipelines
* AI agents
* automation systems
* developer tooling

There is no enforcement layer before execution.

---

## Solution

TEOS introduces a missing control plane:

```text
Generate → Validate → Execute
```

It acts as a **pre-execution enforcement layer** for autonomous code systems.

---

## Core Capabilities

### 🔍 Code Risk Engine

Deterministic rule-based analysis of generated code.

Detects:

* destructive shell commands
* unsafe execution patterns
* eval / dynamic execution abuse
* privilege escalation attempts

---

### 📦 Dependency Security Layer

Analyzes package-level risk signals:

* suspicious dependencies
* unsafe versions
* injection-prone libraries
* supply-chain risk patterns

---

### ⚙ CI/CD Security Guardrails

Scans workflows for:

* secret exposure risks
* unsafe CI permissions
* destructive pipeline commands
* unauthorized deployment steps

---

### 🤖 Telegram Security Gateway

Operational interface for real-time scanning:

* `/scan`
* `/deps`
* `/ci`
* `/status`

Used for live execution validation workflows.

---

## System Architecture

```text
AI Agent / LLM
      ↓
Telegram / API Gateway
      ↓
TEOS Policy Engine
      ↓
Rule-Based Risk Analysis
      ↓
Deterministic Verdict Engine
      ↓
ALLOW / WARN / BLOCK
```

---

## Key Properties

* Deterministic rule execution
* Explainable verdicts
* Pre-execution interception
* CI/CD native integration
* Agent-safe validation layer

---

## Trusted For

* AI agent execution pipelines
* DevSecOps workflows
* autonomous code generation systems
* CI/CD enforcement layers
* internal developer platforms

---

## Pricing

**Starter** — $9 / month
**Builder** — $49 / month
**Pro** — $99 / month
**Enterprise** — Custom deployment

Free tier includes **5 scans**.

---

## Integration Model

* REST API (`/analyze`, `/ci`, `/scan-dependencies`)
* Telegram gateway
* CI/CD plugin pattern
* MCP-compatible architecture

---

## Positioning

TEOS Sentinel Shield is:

> **Execution Control Infrastructure for Autonomous AI**

Not a scanner.
Not a linter.
Not an AI firewall.

It is a **pre-execution control layer for autonomous systems.**

---

## License

TESL License — Enterprise Secure License Model

---
