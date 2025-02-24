SpamFilter V2 by Kenneth Hill
****************
INST364 Final Project

This AI email spam filter recreates a web email application with advanced spam detection capabilities. Using Tensorflow, the filter trains an AI model from sample email data, assigns a probability of spam to each email based on heuristic analysis, and automatically detects emails that surpass a percentage threshold, or contain a blacklisted word (blacklisted words are separated by comma or line). The whitelist functionality supercedes the blacklist, allowing emails with the specified words to remain unfiltered. 



Instructions
- open terminal, navigate to project folder
- run simple-http server
    - `python3 -m http.server 3000`
- visit https://localhost:3000

before filtering:
![AISpamFilter Before filtering](spamfilter1.png?raw=true "AISpamFilter Before filtering")
after filtering:
![AISpamFilter After filtering](spamfilter2.png?raw=true "AISpamFilter After filtering")
