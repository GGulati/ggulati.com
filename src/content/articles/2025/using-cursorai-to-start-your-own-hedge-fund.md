---
title: "Using CursorAI to start your own hedge fund"
date: "2025-02-17"
slug: "using-cursorai-to-start-your-own-hedge-fund"
excerpt: "Poland's exports are booming, and whenever I see news like this I'm curious to visit the country and see what life is like compared to all the headlines."
widgets:
  - "rate-return"
---

_Disclaimer: The information provided in this blog post is for informational and educational purposes only and should not be construed as financial, investment, or legal advice. The views expressed are my own and do not represent the opinions of any employer, organization, or affiliated entity. Investing involves risk, and you should conduct your own research or consult with a qualified financial professional before making any investment decisions._

[Poland's exports are booming](https://notesfrompoland.com/2024/10/14/poland-overtakes-russia-in-value-of-exports-for-first-time/), and whenever I see news like this I'm curious to visit the country and see what life is like compared to all the headlines. I also become curious about how that might reflect in investing - what is the index fund like? How easy is it to invest in it from the US? Should I start my own hedge fund and make zillions? (shhh, [perhaps](https://www.thediff.co/archive/you-and-your-investment-research/) not quite [that easy](https://www.complexsystemspodcast.com/episodes/teaching-trading-ricki-heicklen/))

<details open>
<summary>Back of napkin financial analysis</summary>

Turns out there's a [lot of caveats](https://old.reddit.com/r/ValueInvesting/comments/135cx58/the_polish_stock_market_seems_undervalued/)! There's [research](https://sg.morningstar.com/sg/news/164247/economic-progress-doesnt-equate-to-market-returns.aspx) on how economic growth correlates to stock market growth - [not that well](https://blogs.cfainstitute.org/investor/2023/03/17/myth-busting-the-economy-drives-the-stock-market/), it turns out (though that particular article doesn't look at Poland specifically).

My first thought is to learn by doing a back of napkin calculation myself. The Warsaw Stock Exchange index has ~92x since Apr 1991 until today Feb 2025 ([link](https://tradingeconomics.com/wig:ind)) from 1,000 to ~92,500. In comparison, the S&P 500 ([link](https://tradingeconomics.com/united-states/stock-market)) has merely 32x during the same timeframe, from ~420 to ~13400. Let's not forget the exchange rate exposure though - in Apr 1991 it was [1 USD to 1.2 PLN](https://fxtop.com/en/historical-currency-converter.php?A=1&C1=USD&C2=PLN&DD=01&MM=04&YYYY=1991&btnOK=Go%21&B=1&P=-2&I=1) whereas today it is [1:4.05](https://fxtop.com/en/historical-currency-converter.php?A=1&C1=USD&C2=PLN&DD=01&MM=02&YYYY=2025&btnOK=Go%21&B=1&P=-2&I=1). As an extremely naive buy and hold comparison (plenty of asterisks, e.g. we're not accounting for risk-adjusted returns), if you had bought the WIG in PLN in Apr 1991 and sold in Feb 2025, your return would be 92x WIG growth * (1.2 / 4.05) exchange rate change = ~27x.

<div data-widget="rate-return"></div>

</details>

<figure>
  <a href="https://index-funds.vercel.app/"><img src="/assets/index-funds-readme.png" alt="Index funds app screenshot" /></a>
</figure>

Let's see what opportunities exist around the world - check [it out live](https://index-funds.vercel.app/)! (disclaimer: hosted on Vercel free tier, so might not survive much traffic)

We can create this from scratch via [Cursor](https://www.cursor.com/) - see [technical blog post](/articles/2025/cursorai-for-frontend-dev-first-impressions.html) for details. It took just 4 hours, an incredible a 5x - 10x productivity boost for side projects / new projects. Longer-term development will require evolving the process.

## Development Methodology

1. Initialize react app with `npx create-next-app@latest`
2. Write a small [requirements file](https://github.com/GGulati/IndexFunds/blob/master/compose/requirements.md)
3. Leverage Cursor's compose mode with the prompt: `Help me build the Index Fund app based on the 'requirements.md' file. The UI should be similar to the attached UI`. Attach the files in compose/ as well as a screenshot of the [Yahoo Finance UI for S&P 500](https://finance.yahoo.com/quote/%5EGSPC/).
4. Iterate to add each feature at a time, starting with fetching live data from Yahoo Finance, fixing CORS issues, and incrementally adding new features.
5. Intermediate commands not recorded, but can see feature development in the commit history ([Github](https://github.com/GGulati/IndexFunds)).

## Results

After [analyzing all of these countries](https://index-funds.vercel.app/), even if you had a crystal ball 20 years ago, you would choose to invest in the S&P 500! Perhaps we'll have to wait to found our hedge fund, but thanks to LLM-first development we can explore our ideas extremely quickly.
