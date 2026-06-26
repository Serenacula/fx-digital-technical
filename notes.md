# Process Notes

## Challenge 1

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
    - I adjusted it to not resize prior to doing the work. I'd rather not use efficiency shortcuts that might make the result worse until I know how it actually runs. If it's still a problem, I can come back to this.
3. Next I move onto the actual plan. The AI runs to build out the plan, and flags anything it thinks I should know about. I also make sure I understand the architecture it is proposing, and any implicit decisions its made.
    - In this case, it had made a decision to only count pixels with alpha > 128. I changed this, it should use all pixels except those with 0 alpha.
4. I then have it spawn a sub-agent to perform a critique of the plan as it stands.
    - It surfaced a bunch of issues. Most were more for the AI. A few that needed decisions:
        - File types we wanted to support, and validation
        - File size limitations, to avoid freezing the app. I went with 16mb, and noted it as something I might adjust depending on performance afterwards.
        - How do I want to count the pixels, if we aren't including transparent ones?
            - On consideration of this, I realised it actually makes more sense to count transparency too, and just class it as a separate 'colour'
            - I'm also considering the idea of having the level of alpha classed as transparent something the user can select on the UI. I decided this was feature creep, and that I wouldn't support it for now.
5. I discuss the plan as it stands, make sure I agree with all the decisions made
    - Decided to drop support for gifs, since they're significantly more complicated to solve, and not worth the extra time for a niche usecase.
6. I move onto to planning out the tests. This stage is deliberately separated from the actual implementation to avoid fitting tests to the result.
    - I also asked it to explicitly generated some test images for us to compare against where we would know for sure the result
    - Again, asking a sub-agent to cold-eyes critique the testing plan.
7. Implementation.
    - I specified I wanted it to use a sub-agent for this, to avoid hitting context limits as much.
        - On consideration, I actually think this isn't a great call, it just adds an extra layer between you and the agent actually doing the build.
        - In the future I'm going to adjust the skill to plan and implement specifically with subagent orchestration in mind, I think. Didn't do it for this, but it makes more sense to me as an approach to get it done quicker.
8. Refinement.
    - The app was built with very flawed CSS. I think specifying a black-and-white colourscheme led to it making a very barebones CSS setup. Initial work was to get some basic visuals working.
        - Turns out there was a bug causing this, pretty easy to track down.
    - Once the basics were there, I made adjustments according to what I'd consider an intuitive UI, and stuff missed:
        - Needed some basic adjustments to make it mobile friendly.
        - The description "Colour Grouping" to describe the quant is not intuitive. Need to think of a better way to describe this.
        - Adjusted how images are uploaded to be friendlier.
        - Added a drag-and-drop feature, since I felt like it was missing.

9. Bug hunting
    - Ran my bug-loop skill, to identify and chase down bugs the AI can find.
    - After fixing those bugs, I checked in person for bugs, found a couple more to fix.

10. Second refinement:
    - Adjusting the padding of the image to match other areas
    - Show supported image formats somewhere
    - Adjust colours

---

## Challenge 2

For this part I decided to go for the "ignore certain colours challenge". This is mostly because I think the efficiency is already quite good so I'm not gonna see much gain from that, and the X dominant features was already part of how I designed the first challenge, so doesn't really make sense to do.

Initial thoughts on how to implement were:

1. Set it up such that certain common colours could be removed via tickbox
2. A blacklist panel, that let you select colour ranges to remove
3. An 'ignore' function, that removes certain colours from the percentage calculations and moves them to the bottom of the barchart greyed out

All three implementation styles had issues. 1 leaves our definition of 'white' vague, and ends up with a complicated UI where the user is defining white via lightness and saturation. 2 felt like it was overcomplicating the problem. 3 does not leave a good intuitive solution for how to handle quant changes.

I ended up going with 3, since I figured it has the nicest UI, and isn't too difficult to solve.

I solved the quant problem by including the quant as part of the excluded colour: so any colour of that colourset gets included.

---

## Code Review

Reviewed the code, realised that I didn't like the way it had been set up, so did a big refactor to make it fit how I wanted it. Notably:

- Index as an orchestrator, not doing any actual logic
- TS factory for DOM handles and the like
- TS files to manage various UI elements:
    - Bar chart
    - Controls
    - Drop handler
- ImageProcessor singleton to handle the file and extracting the raw contents from it
- AggregationEngine singleton to handle the actual logic of quant and colour extraction
