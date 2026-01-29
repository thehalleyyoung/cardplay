#!/usr/bin/env python3
"""Update currentsteps-branchC.md to mark completed items."""

import re

with open('currentsteps-branchC.md', 'r') as f:
    content = f.read()

# Mark C084
content = re.sub(
    r'- \[ \] C084 Add support for .soft constraints',
    '- [x] C084 Add support for "soft constraints"',
    content
)
content = re.sub(
    r'\(requirements\)\.\n',
    '(requirements). *(hard field in music-spec.ts)*\n',
    content,
    count=1
)

# Mark C085
content = re.sub(
    r'- \[ \] C085 Add Prolog predicate `preference/2`',
    '- [x] C085 Add Prolog predicate `preference/2`',
    content
)
# Mark C086
content = re.sub(
    r'- \[ \] C086 Add .weight',
    '- [x] C086 Add "weight"',
    content
)
content = re.sub(
    r'scoring aggregator\.\n',
    'scoring aggregator. *(weight in music-spec.ts)*\n',
    content,
    count=1
)

# Mark C089
content = re.sub(
    r'- \[ \] C089 Add .constraint pack',
    '- [x] C089 Add "constraint pack"',
    content
)

# Mark C090
content = re.sub(
    r'- \[ \] C090 Add Prolog predicate `constraint_pack/2` mapping pack id to constraints list\.',
    '- [x] C090 Add Prolog predicate `constraint_pack/2` mapping pack id to constraints list. *(In music-spec.pl)*',
    content
)

with open('currentsteps-branchC.md', 'w') as f:
    f.write(content)

print('Done updating roadmap items.')
