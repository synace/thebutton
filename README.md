# synace/thebutton

[synace/thebutton](https://github.com/synace/thebutton) - Ethereum Web3JS client for TheButton game by Reddit user royalforkblog

### Purpose

This was a single-use single-purpose client for the game published to an Ethereum contract at [0xf7f6b7164fb3ab456715d2e8b84e8baac8bd09a9](https://etherscan.io/address/0xf7f6b7164fb3ab456715d2e8b84e8baac8bd09a9)

[royalforkblog](https://www.reddit.com/user/royalforkblog) posted this game on [reddit.com/r/ethereum](https://www.reddit.com/r/ethereum/comments/85u6cd/my_first_dapp_rthebuttonin_ethereum/) and explained the rules on his own blog: [My first Dapp, r/theButton....in ethereum :) royalfork.org](https://www.royalfork.org/2018/03/20/button/)

The goal was simply to be the last one to click and to have your countdown reach 0 before any other players replace you.

### Game Constraints

* Your countdown decreases by 10 blocks per click
* The delay between your clicks increases by 15 blocks per click
* Countdown starts at 1500 block per player
* The shortest countdown allowed is 10 blocks
* .001 ETH per click
* .5% current-pot value fee for first click

### Strategy

So, in this spirit, my client's goal was simply to always be last; to be ahead of the other players.

It watches the contract for a status indicating that another player clicked and replaces the last presser by clicking as soon as it is able. It doesn't bother replacing itself.

An alternative, but objectively more expensive strategy would be to ignore the other players and even replace itself as soon as it was able in an attempt to be the first person with the shortest countdown of 10 blocks and to have more attempts at 10 blocks versus other players depending on the lead established in number of clicks.

In order to understand the game mechanics a little better, I created a spreadsheet to record the relevant countdown, delay (cooloff), days played, total eth contributed and associated USD value (at $530USD/ETH).

![Spreadsheet of Clicks](/assets/clicks.png)

Either way, there was a point at which the clicker wouldn't be able to click in time to prevent another player of the same level from winning. At click number 61, approximately 19.7 days into the game, the countdown is only 900 blocks. However, the delay between clicks is 915 blocks. This would be the point at which a 2nd account is needed by the leader in order to prevent the 2nd place non-leader from winning.

This results in a recursion in which a *2nd..nth* account is needed to keep *n* non-leaders from winning, and to provide the leader with the ability to exhaust the delay and make an attempt at clicking for a minimum 10 block countdown win.

### Results

In real life, things happen. The first day I was clicking manually. I missed a few clicks here and there but I was in the lead. I talked to a friend about it and thought this would be an interesting project to write a Web3JS client for and to compare implementations. That night I began writing my client, but didn't finish it in time to trust running it overnight. I set an alarm and woke up one time overnight to click just in time for a single cycle and to keep on pace. In the morning, I tweaked my client a bit and started it.

I was running it in an incognito browser window open in my laptop. I was just proving it out and was planning on writing and deploying a nodejs cli-based client to a server instead. It clicked for me, so I closed it and went to work. However, it appears that another player had setup a client to do automated clicking every 2 hours. I was also behind the by 2 clicks. When I got to work, I opened it up and ran my automated clicker all day. When I got home I started writing the nodejs version. I didn't finish it in time to run overnight, so I kept the web based one running overnight & the next day. But, I had to shut it off for my commute and two other hour-long drives. I set aside some time to finish my nodejs version and deploy it on the server.

![Failed Clicks](/assets/fails.png)

It was at this time that I also noticed that the other player's automated 2-hour fixed clicking window was running into their delay. It had not expired yet, but they were sending clicks anyways. Those clicks were rejected and that allowed me to remain in the lead and for my countdown to keep counting down. By the time the 4 hours rolled around, I was almost nearly to 0 on my delay. The other player would then take my place and a new 4-hour cycle would begin. With each cycle, I got 10 blocks closer to 0 at the end of each cycle. It took 2 days and 10 hours, but I finally reached 0 before the other player's 2-hour click was triggered. It was a bit sooner than I expected, I think [blocks were speeding up slightly during that window](https://etherscan.io/chart/blocks). There was a a time period of about 4 hours that I needed to be un-interrupted in order to win.

### Conclusions

Ultimately I was only able to win because there was no one stopping me from winning. Any other click in that 4-hour window would have stopped me.

Played perfectly, the game is non-winnable and only limited by the funds at risk by the players involved and by the tolerance for risk of client or network failure. Provided there are infinite funds and a 0% chance of failure, the game is non-winnable & goes on forever.

In the words of the **WOPR** (1983, WarGames): *"the only winning move is not to play"*
