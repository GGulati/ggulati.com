---
title: "Roll Through the Ages"
date: "2026-05-19"
slug: "roll-through-the-ages"
excerpt: "Notes on building a browser implementation of Roll Through the Ages"
draft: true
---

I recently semi-vibe-coded a take on the board game [Roll Through the Ages](https://ggulati.github.io/RollThroughAges/) in a weekend, including a minimax AI and AI tournaments.

- [Demo](https://ggulati.github.io/RollThroughAges/)
- [Source code](https://github.com/GGulati/RollThroughAges)

<figure>
  <img src="/assets/rollthroughtheages.png" alt="Roll Through the Ages" />
</figure>

## Highlights

It feels extraordinary to be able to digitize a board game so quickly. I chose a dice-based game because I knew I wanted headless bot tournaments, and dice-based games have a large range of outcomes - so enough of a problem space to see how well Claude/Codex generates "AI" code.

For development, I focused on the data structures, which were "vibe engineered" to be generalizable, then built the UX in vertical slices. I'd originally planned for a more waterfall approach - engine/model, then view, then controller - but that quickly proved unwieldy and clearly incorrect. Still, with a clear foundation in the data model, the rest of the game came together pretty quickly in a day or so.

On the second, I was able to add a basic heuristic-based bot with AI tournaments - which also served as a good way to stress test the game, add observability, and so on. Adding a minimax bot, running tournaments, and improving the UX (behold - 3D dice via CSS) took the third day of the long weekend.

The minimax AI is still terrible, and Codex struggled with how to improve it. Overall, agents still want to be very lazy and patch in changes to data models, or hack in fixes to AI - and then get stuck in loops or claim to be complete when the changes fail evals.

A future exploration would be to plug in LLM bots, given a primer prompt with rules, a (json) representation of game state, and a menu of possible actions.