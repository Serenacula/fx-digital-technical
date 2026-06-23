# Process Notes

Initial thoughts: firstly, the challenge is something I don't know much about. My initial step is to get an idea of the problem. I ask Claude to give me a sense of how it would complete it: its understanding of the problem, and the packages it think would be suitable specifically.

I have pre-specified using typescript and astro, since I believe this is a fairly straight-forward stack for the problem. I'd considered making it a rust CLI application, which has the advantage of not needing a UI, but the requirements stated I use my most familiar language, so typescript it is. It also makes it easier to add a UI.

Initial thought is on the requirements of what I want. Quant value is left unspecified, but if I were a user I'd want to be able to control it. That indicates it should be a UI feature. My thought is:

- Image on the top left of the UI
    - Maybe a place showing the image resolution underneath it
- Underneath it are UI controls
    - Quant
    - Do we count include alpha in colour? No, question specifies we
- On the right, a vertical bar chart ordered by colour percentage
    - Initial layout idea:
        - Colour as RGBA value

On the architecture:

- This will be an astro webpage hosted on github, so it'll have to be static. That rules out a bunch of the image libraries, since they're mostly server-side.
    - For the moment I'm using the browser's native canvas API. Should be efficient and AI will definitely know how to use it.
- AI wanted to resize for efficiency. I don't like making efficiency shortcuts before I even know the baseline, so I blocked this.

Process note:

1. I interrogate the AI about the subject in question, making sure I'm roughly on the same page about what's going on.
2. I describe roughly what I intend for the app. This specifies UI decisions, features I want, etc. I'm using a skill for this stage, which encourages the AI to ask me about any open questions. This is specifically concerning building out the spec.
    1. I adjusted it to not resize prior to doing the work. I'd rather not use efficiency shortcuts that might make the result worse until I know how it actually runs. If it's still a problem, I can come back to this.
3. Next I move onto the actual plan. The AI runs to build out the plan, and flags anything it thinks I should know about. I also make sure I understand the architecture it is proposing, and any implicit decisions its made.
    1. In this case, it had made a decision to only count pixels with alpha > 128. I changed this, it should use all pixels except those with 0 alpha.
    2. I then have it spawn a sub-agent to perform a critique of the plan as it stands.
