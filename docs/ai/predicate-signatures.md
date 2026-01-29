# Prolog Predicate Signatures

This page consolidates Prolog predicate signatures across CardPlay’s KBs. Dedicated references:

- Music theory: `music-theory-predicates.md`
- Boards/decks: `board-predicates.md`
- Composition patterns: `composition-predicates.md`

## Workflow planning (`src/ai/knowledge/workflow-planning.pl`)

- `task_decomposition/3` — `task_decomposition(Goal, Persona, Steps).`
- `deck_sequencing/2` — `deck_sequencing(Goal, Decks).`
- `parameter_dependency/3` — `parameter_dependency(Param, SourceDeck, AffectedDeck).`
- `routing_requirement/3` — `routing_requirement(Task, SourceDeck, TargetDeck).`
- `workflow_checkpoint/2` — `workflow_checkpoint(Task, Checks).`
- `deck_configuration_pattern/3` — `deck_configuration_pattern(Task, DeckType, Settings).`
- `parameter_preset_rule/3` — `parameter_preset_rule(DeckType, Task, Values).`
- `cross_deck_sync_rule/3` — `cross_deck_sync_rule(Param, Deck1, Deck2).`
- `routing_template/3` — `routing_template(TaskType, DeckSet, Connections).`
- `signal_flow_validation/2` — `signal_flow_validation(Issue, Description).`
- `routing_optimization/2` — `routing_optimization(Technique, Description).`
- `workflow_interrupt_policy/2` — `workflow_interrupt_policy(Goal, Policy).`
- `workflow_resume_strategy/3` — `workflow_resume_strategy(Goal, CompletedStepIndex, Strategy).`
- `workflow_skip_on_resume/2` — `workflow_skip_on_resume(Goal, Step).`
- `workflow_checkpoint_step/2` — `workflow_checkpoint_step(Goal, Step).`
- `workflow_template/4` — `workflow_template(Id, Category, Persona, Goal).`
- `workflow_category/2` — `workflow_category(Category, Description).`

## Project analysis (`src/ai/knowledge/project-analysis.pl`)

Issue catalogs:

- `project_health_metric/2` — `project_health_metric(Metric, Description).`
- `missing_element_detection/2` — `missing_element_detection(Issue, Remedy).`
- `overused_element_detection/2` — `overused_element_detection(Issue, Remedy).`
- `structural_issue_detection/2` — `structural_issue_detection(Issue, Remedy).`
- `technical_issue_detection/2` — `technical_issue_detection(Issue, Remedy).`
- `style_consistency_check/2` — `style_consistency_check(Issue, Description).`
- `harmony_coherence_check/2` — `harmony_coherence_check(Issue, Description).`
- `rhythm_consistency_check/2` — `rhythm_consistency_check(Issue, Description).`
- `instrumentation_balance_check/2` — `instrumentation_balance_check(Issue, Description).`
- `project_complexity_metric/2` — `project_complexity_metric(Metric, Description).`
- `simplification_suggestion/2` — `simplification_suggestion(Technique, Description).`
- `beginner_safety_check/2` — `beginner_safety_check(Check, Warning).`
- `suggest_improvement/2` — `suggest_improvement(Category, Suggestion).`

Snapshot-driven analysis:

- `project_has/1` *(dynamic)* — `project_has(Element).`
- `project_issue_flag/2` *(dynamic)* — `project_issue_flag(Category, Issue).`
- `project_stat/2` *(dynamic)* — `project_stat(Metric, Value).`
- `project_issue/3` — `project_issue(Category, Issue, RemedyOrDescription).`

## Learning (`src/ai/knowledge/user-prefs.pl`)

- `user_prefers_board/2` *(dynamic)* — `user_prefers_board(UserId, BoardId).`
- `user_workflow/2` *(dynamic)* — `user_workflow(UserId, Workflow).`
- `user_genre_preference/2` *(dynamic)* — `user_genre_preference(UserId, Genre).`
- `user_skill_level/2` *(dynamic)* — `user_skill_level(UserId, SkillLevel).`
- `user_generator_style/3` *(dynamic)* — `user_generator_style(UserId, Generator, Style).`
- `user_board_transition/3` *(dynamic)* — `user_board_transition(UserId, From, To).`
- `user_constraint_template/3` *(dynamic)* — `user_constraint_template(UserId, Generator, ConstraintId).`
- `recommend_board/2` — `recommend_board(UserId, BoardId).`
- `recommend_genre/2` — `recommend_genre(UserId, Genre).`
- `recommend_next_board/3` — `recommend_next_board(UserId, Current, Next).`
- `should_simplify/1` — `should_simplify(UserId).`
- `preferred_generator_style/3` — `preferred_generator_style(UserId, Generator, Style).`
- `learned_workflow_pattern/3` *(dynamic)* — `learned_workflow_pattern(UserId, PatternId, DeckSequence).`
- `learned_parameter_preference/4` *(dynamic)* — `learned_parameter_preference(UserId, Param, DeckType, PreferredValue).`
- `learned_routing_pattern/4` *(dynamic)* — `learned_routing_pattern(UserId, FromDeck, ToDeck, Purpose).`
- `suggest_workflow/3` — `suggest_workflow(UserId, CurrentDecks, NextDeck).`
- `suggest_parameter/4` — `suggest_parameter(UserId, Param, DeckType, PreferredValue).`
- `suggest_routing_pattern/3` — `suggest_routing_pattern(UserId, FromDeck, ToDeck).`
- `has_learned_patterns/1` — `has_learned_patterns(UserId).`

## Adaptation (`src/ai/knowledge/adaptation.pl`)

- `skill_level_order/2` — `skill_level_order(Level, Order).`
- `feature_complexity/2` — `feature_complexity(Feature, MinLevel).`
- `feature_visible_for/2` — `feature_visible_for(Feature, UserLevel).`
- `adaptive_suggestion_rule/3` — `adaptive_suggestion_rule(SkillLevel, Category, Action).`
- `adapt_suggestion/3` — `adapt_suggestion(SkillLevel, Raw, Adapted).`
- `progressive_disclosure_rule/2` — `progressive_disclosure_rule(Feature, MinLevel).`
- `should_disclose/2` — `should_disclose(Feature, UserLevel).`
- `advanced_override_active/0` *(dynamic)* — `advanced_override_active.`
- `should_disclose_override/2` — `should_disclose_override(Feature, UserLevel).`
- `skill_estimation/3` — `skill_estimation(Area, Actions, EstimatedLevel).`
- `error_pattern_detection/2` — `error_pattern_detection(PatternId, Description).`
- `corrective_suggestion/2` — `corrective_suggestion(PatternId, Suggestion).`

## MusicSpec (`src/ai/knowledge/music-spec.pl`)

Dynamic state:

- `spec_key/3` *(dynamic)* — `spec_key(current, Root, Mode).`
- `spec_meter/3` *(dynamic)* — `spec_meter(current, Num, Den).`
- `spec_tempo/2` *(dynamic)* — `spec_tempo(current, BPM).`
- `spec_tonality_model/2` *(dynamic)* — `spec_tonality_model(current, Model).`
- `spec_style/2` *(dynamic)* — `spec_style(current, Style).`
- `spec_culture/2` *(dynamic)* — `spec_culture(current, Culture).`
- `spec_constraint/4` *(dynamic)* — `spec_constraint(current, Constraint, Kind, Weight).`

Access + evaluation:

- `current_spec/1` — `current_spec(Spec).`
- `constraint/1` — `constraint(C).`
- `hard_constraint/1` — `hard_constraint(C).`
- `soft_constraint/2` — `soft_constraint(C, Weight).`
- `constraint_type/2` — `constraint_type(Constraint, Type).`
- `with_constraints/3` — `with_constraints(SpecIn, ExtraConstraints, SpecOut).`
- `satisfies/2` — `satisfies(Candidate, Constraint).`
- `violates/2` — `violates(Candidate, Constraint).`
- `violation_reason/3` — `violation_reason(Candidate, Constraint, Reason).`
- `spec_conflict/3` — `spec_conflict(ConstraintA, ConstraintB, Reason).`
- `all_spec_conflicts/1` — `all_spec_conflicts(Conflicts).`

