---
title: Quickstart Guide for Data Take-home Tests
date: 2026-02-15
---

Historically, most data roles at startups ask candidates to complete a "short" takehome assignment, typically analyzing a small dummy dataset with whatever tools you have available. Companies often ask that candidates spend no more than a few hours on the task - demonstrating your analytical and technical (ie sql or python) skills. However in my experience it can easily take a few hours just to get things set up in a way that you can actually write queries to start your analysis. The goal of this guide is to help streamline that process.

# Tools / Services
- DB:
  - [Supabase](https://supabase.com/pricing): Free tier is fairly robust, getting data in and setup was a little more confusing
  - [Tiger Data](https://www.tigerdata.com/): New entrant, free tier seems pretty solid.
  - [ElephantSQL](https://www.elephantsql.com/): RIP
- Analysis / Visualizations:
  - [Mode](https://mode.com/): Best for SQL-first folks
  - [Hex](https://hex.tech/): Best for Python-first folks
  - [Jupyter](https://anaconda.org/channels/anaconda/packages/jupyter/overview): (via Anaconda) run python notebooks locally off of CSVs
- Automations
  - [Clay](https://www.clay.com/pricing): Small free tier, useful to help with things like enrichment or data cleaning
 
And of course Claude Code / Codex.

# Instructions

## SQL Route
1. Sign up for a free DB service (my current favorite is [Supabase](https://supabase.com/pricing)).
2. Export your takehome dataset(s) to csv.
3. Many free DB services offer import functionality, but it is often buried in menus and surprisingly hard to find (likely because these are mostly meant to be used as app backends, not for analytics). Run this python script to create a destination table for your csv and insert data 10k rows at a time.
4. Sign up for [Mode](https://mode.com/) and go to "Connect a Database..." from the dropdown:

    <img width="259" height="187" alt="image" src="https://github.com/user-attachments/assets/4663372f-d79d-483c-8b7c-15f60cb9e4fa" />
5. Choose the option to add a Postgres db and add your connection details from Supabase
6. You should now be able to create a new SQL query and see your connection on the right hand side:

    <img width="832" height="307" alt="image" src="https://github.com/user-attachments/assets/d8f24663-94aa-4617-b87c-46e18716595c" />


## Hosted Python Notebook Route
TODO

## Local Python Notebook Route
TODO
