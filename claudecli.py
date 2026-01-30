import time

# time.sleep(3600*4) # 4 hours
for i in range(10):
    import os 
    z = f"continue doing and marking objects in currentsteps-branchC.md, as systematically and for as long as you can (without my input - do what you think is best).  Make sure its wired in a way that is congruent type-theoretically and API-wise with the rest of the repo and the .md docs.  Do everything to their utmost, prioritizing completeness and theoretical cohesion over speed."
    z = "begin, going one by one, implement and then check off all the systematic changes/additions that have to be made under gofai_goalA.md, periodically compiling to make sure things still work (when you get to a point that they should) and using docs/ and gofaimusicplus.md as a resource for SSOT.  Be thorough and complete - each step should take over 500 LoC, and some steps (where you are trying to enumerate extensively over a large set of natural language or musical terms or ways of communicating) should take over 20000 (but only do 600 at a time to avoid length limits)."
    # z = "Keep on tackling and marking off todo items in to_fix_repo_plan_500.md.  Try to get through as many as you can without stopping"
    os.system(f"claude -p '{z}' --dangerously-skip-permissions")