import time

# time.sleep(3600*4) # 4 hours
while True:
    import os 
    z = f"continue doing and marking objects in currentsteps-branchC.md, as systematically and for as long as you can (without my input - do what you think is best).  Make sure its wired in a way that is congruent type-theoretically and API-wise with the rest of the repo and the .md docs.  Do everything to their utmost, prioritizing completeness and theoretical cohesion over speed."
    os.system(f"claude -p '{z}' --dangerously-skip-permissions")