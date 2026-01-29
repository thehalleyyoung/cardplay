while True:
    import os 
    z = f"continue doing and marking objects in currentsteps-branchA.md, as systematically and for as long as you can (without my input - do what you think is best).  Make sure its wired in a way that is congruent type-theoretically and API-wise with the rest of the repo and the .md docs.  Assume the final application will be run in the browser, and should have as beautiful a browser UI as possible."
    os.system(f"copilot -p '{z}' --model claude-sonnet-4.5 --allow-all-tools")