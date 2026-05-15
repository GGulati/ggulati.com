---
title: "Membership 101"
date: "2026-05-11"
slug: "membership-101"
excerpt: "A small interactive model for how acquisition, trial conversion, paid retention, and an existing member base determine the long-term size of a subscription business."
widgets:
  - "subscription-vitals"
---

In my hot new AI startup, I'm charging $20 a month for an AI that automatically sends you photos of your pet whenever your Ring camera spots them.

I post on TikTok constantly to get hundreds of signups every month, but only 60% of them stay after the first month trying it out. And after that, I manage to keep 90% of them - the occasional payment fails or they cancel because their dog grew up and is [moving out to become a full-time blogger](https://en.wikipedia.org/wiki/On_the_Internet,_nobody_knows_you%27re_a_dog).

So... how many subscriptions will I end up having eventually? Could I figure out how much my business could earn?

The simple version is:

```
stable members = monthly acquisitions / (1 - paid monthly retention)
```

Alas, we have to account for the first month churn, because 40% of people just don't love their pets enough.

That means our formula is:
```
stable paid members =
  (monthly acquisitions × free-trial retention)
  / (1 - paid monthly retention)
```

The graph rises toward the equilibrium level, where new paid members from the acquisition funnel exactly offset paid member churn.

<div data-widget="subscription-vitals"></div>

The more interesting part is the return on increasing retention: if you improve the paid retention rate by 1 percentage point, the stable members increase by 10% to 3,333. That's becase you reduced the churn rate by 10% relatively - from 10% to 9%.

This gives you increasing returns on each percentage point improvement: going from 97% paid retention to 98% paid retention [1] enormously increases the stable paid members from 10,000 to 15,000!

[1] AKA reducing from 3% churn rate to 2% churn rate, a 33% reduction
