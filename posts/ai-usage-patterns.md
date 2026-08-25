---
title: AI usage patterns in software teams
date: 2026-08-24
---

*Edition 01 · Tim Qi · 2026*

Tens of thousands of teams build software inside Linear every day. Over six years that’s given us a detailed picture of how product development happens, from before AI was widely adopted to now.

Model companies and coding tools have published plenty on token usage and code volume, but that captures only one layer of the work. We’re unusually well placed to see the entire workflow behind building a product, from the first issue to the pull request that closes it. What we can’t see is AI usage that happens outside Linear, so this is a picture of adoption inside our own customer base, not the market at large.

We look at three things across that transition: who is using AI, how it reshapes where teams spend their time across Linear, and whether it changes how much they ship. Together they make a fixed point for where AI-assisted product development stands in 2026, and something to measure the next edition against.

> This report was originally published by [Linear](https://linear.app/data). Reproduced here by the author.

## Adoption

### AI adoption has spread to every function

Between January and June 2026 the share of users active on AI features more than doubled in every function. Product climbed fastest, from 12% to 34%, and even go-to-market, the function furthest from the codebase, went from 5% to 18%. We classify roles by normalizing job titles, which carries some error at the edges, but the pattern is too broad to be an artifact of labeling.

| Function | Jan 2026 | Jun 2026 | Change |
| --- | ---: | ---: | ---: |
| Founder | 14% | 30% | +16pp |
| Engineering | 12% | 30% | +18pp |
| Product | 12% | 34% | +22pp |
| Design | 6% | 22% | +16pp |
| GTM | 5% | 18% | +13pp |

<div class="data-chart" id="chart-function"></div>

*N = 127,000 paid users active in both January and June 2026.*

### Adoption goes all the way to the top

Executives are personally active on AI at rates that match or beat their teams. CEOs at companies of 201 or more people went from 9% to 36% in six months, the largest jump of any cut in this report, suggesting the most senior leaders are learning the technology by using it rather than reading about it. Company size comes from third-party enrichment, so this cut covers fewer workspaces than the rest of the report.

| Executive group | Jan 2026 | Jun 2026 | Change |
| --- | ---: | ---: | ---: |
| Founder, 201+ | 10% | 26% | +16pp |
| Founder, 51–200 | 15% | 27% | +12pp |
| Founder, 1–50 | 15% | 31% | +16pp |
| CEO, 201+ | 9% | 36% | +27pp |
| CEO, 51–200 | 15% | 25% | +11pp |
| CEO, 1–50 | 7% | 21% | +14pp |
| CPO, 201+ | 3% | 24% | +21pp |
| CPO, 51–200 | 10% | 26% | +15pp |
| CPO, 1–50 | 11% | 36% | +25pp |
| CTO, 201+ | 11% | 35% | +24pp |
| CTO, 51–200 | 12% | 28% | +16pp |
| CTO, 1–50 | 16% | 33% | +17pp |

<div class="data-chart data-chart-tall" id="chart-executives"></div>

*N = 13,300 executives active in both January and June 2026.*

### Adoption is consistent at every size

AI adoption roughly tripled everywhere, from startups to enterprises. Company size, usually a good predictor of how fast an organization moves on new technology, barely registers here.

| Company size | Jan 2026 | Jun 2026 | Change |
| --- | ---: | ---: | ---: |
| 1,001+ employees | 8% | 25% | +17pp |
| 201–1,000 employees | 9% | 27% | +19pp |
| 51–200 employees | 9% | 25% | +16pp |
| 1–50 employees | 8% | 23% | +14pp |

<div class="data-chart" id="chart-size"></div>

*N = 199,000 paid users with a known company size, active in both January and June 2026.*

## Application

### Teams are putting more into the system

Between June 2025 and June 2026, time spent creating, triaging, and commenting rose in nearly every function, with engineering up roughly 17% on create and triage alone. Founders show much larger swings, up 17 minutes on creation and 26 on commenting, though they’re a smaller cohort and noisier for it. More work seems to need more coordination, and that coordination increasingly sets the context agents act on.

| Activity | Engineering | Product | Design | GTM | Founder |
| --- | ---: | ---: | ---: | ---: | ---: |
| Create & triage | +5m | −1m | +3m | +4m | +17m |
| Assign & update | +3m | 0m | +3m | +3m | +7m |
| Comment | +5m | +1m | +2m | +6m | +26m |

<div class="data-chart" id="chart-work"></div>

*Average change in minutes per user per month, June 2025 to June 2026. N = 54,300 paid users in June 2025 and 89,000 in June 2026.*

### AI authors nearly half of all issues

Two years ago, fewer than one issue in a thousand was created by AI. Teams now use AI to write just under half of everything created in Linear, and at the current pace it will soon author more than people and integrations combined.

| Week of | Agents & MCP | People & integrations |
| --- | ---: | ---: |
| Jun 3, 2024 | 0k | 605k |
| Jun 2, 2025 | 18k | 1,095k |
| Jan 5, 2026 | 206k | 1,601k |
| Apr 6, 2026 | 1,038k | 2,063k |
| Jul 6, 2026 | 2,078k | 2,532k |
| Aug 3, 2026 | 2,435k | 2,481k |

<div class="data-chart" id="chart-issues"></div>

*Issues created per week, excluding imported issues.*

### Planning time didn’t move inside Linear

Time spent on customer requests, docs, and projects held steady in a year when nearly everything else in this report moved up. Planning practice varies widely from team to team, and plenty of it happens in conversation before it lands anywhere, so the average blends heavy planners with light ones. What the steadiness suggests is that AI has so far changed how teams execute far more than how they decide what to build.

Across engineering, product, design, go-to-market, and founders, the change in monthly time spent on customer requests, docs, and projects ranged from zero to one minute between June 2025 and June 2026.

<div class="data-chart" id="chart-planning"></div>

### A new layer of work appeared

Chatting with AI and delegating issues to agents are categories of work that didn’t exist a year ago, and they now show up in every function’s week, with product leaning in hardest. Nothing else shrank to make room, which suggests AI has landed on top of existing work rather than replacing any of it, at least so far.

| New AI activity | Engineering | Product | Design | GTM | Founder |
| --- | ---: | ---: | ---: | ---: | ---: |
| Agent issues | +1m | +1m | 0m | 0m | +2m |
| Chat with AI | +2m | +5m | +3m | +3m | +4m |

<div class="data-chart" id="chart-ai-work"></div>

*Average change in minutes per user per month, June 2025 to June 2026.*

## Output

### Non-engineers are shipping more code

The share of product managers attaching pull requests rose from 3% to 10% in two years, and designers from 1% to 8%. We only count pull requests in repositories connected to Linear, so anyone shipping outside that loop is invisible here, which makes these numbers floors rather than ceilings. The people who used to describe a change increasingly ship it themselves.

| Function | Jun 2024 | Jun 2025 | Jun 2026 | Change |
| --- | ---: | ---: | ---: | ---: |
| Founder | 11% | 12% | 23% | +12pp |
| Engineering | 20% | 22% | 34% | +14pp |
| Product | 3% | 3% | 10% | +7pp |
| Design | 1% | 2% | 8% | +7pp |
| GTM | 1% | 1% | 3% | +2pp |

<div class="data-chart" id="chart-pr-roles"></div>

*Percentage of users who attached a pull request in the prior 30 days. N = 166,000 paid users in June 2026.*

### Pull requests are up 111% in two years

Pull requests opened per workspace are up 111% on a June 2024 baseline. Output held roughly level for the first year, then bent upward through 2026 as model quality and adoption climbed together. We count PRs opened rather than merged, and an opened PR says nothing about the value of the change, but the inflection is hard to miss.

The weekly series moved from its June 2024 baseline to +22% in June 2025, then accelerated sharply: +27% in early February 2026, +50% in early March, +80% in May, and +111% by June 21.

<div class="data-chart" id="chart-pr-volume"></div>

*N = 47,900 paid workspaces in June 2026.*

### Coding agents account for most of the acceleration

Teams that connected a coding agent roughly tripled their weekly pull requests over two years, from 21 to 65, while teams without one went from 8 to 10. These teams were already higher-output before coding agents existed, so the levels aren’t directly comparable, but each cohort against its own baseline tells a clean story, and nearly all the growth sits on the agent side.

| Week of | Coding-agent teams | Traditional teams |
| --- | ---: | ---: |
| Jun 2, 2024 | 21 | 8 |
| Jun 1, 2025 | 28 | 8 |
| Jan 11, 2026 | 35 | 7 |
| Mar 1, 2026 | 49 | 9 |
| May 17, 2026 | 60 | 10 |
| Jun 21, 2026 | 65 | 10 |

<div class="data-chart" id="chart-agents"></div>

*Average pull requests opened per workspace per week. Fixed cohort of 6,887 paid teams: 4,280 with coding agents and 2,607 without.*

## A closing note

The clearest indication of AI’s influence on product development is the dramatic output gains experienced by teams using coding agents over the last two years. We have no way of knowing whether this increased output led to positive business outcomes, but it shows a very clear correlation between AI adoption and acceleration.

Perhaps more intriguing is the makeup of that adoption, and how it appears to be blurring roles. Senior leaders are doing more of the hands-on IC work, adopting AI aggressively to help them do it, and non-engineers are committing code. The suggestion that everyone in an organization is becoming a “builder” seems to be directionally true.

Those gains haven’t shown up as time saved, though. Time spent on existing tasks in Linear held while AI usage appeared as a new layer of work, meaning the overall time spent on product development is going up rather than down. As far as we can observe, teams are working more, not less, suggesting AI has a Jevons paradox quality beyond token consumption.

Many will rightfully argue that looking at pull requests indicates motion rather than value, which is certainly true, but it’s still a step forward from measuring tokens. A mechanical refactor might burn lots of tokens while a meaningful bug fix or code review doesn’t, so token spend and value don’t line up at all, and using one as a proxy for the other will be remembered as a relic of AI’s early days.

In future reports we intend to go deeper on the full lifecycle of work, from token spend all the way to outcomes, something we can newly observe now that code and code review run through Linear as well.

— **Tim Qi, Head of Data**

<script src="data-charts.js"></script>
