from datetime import date

from backend import rules

TODAY = date(2026, 11, 24)


def test_usual_probabilities():
    assert [rules.usual_probability(s) for s in rules.STAGES] == [10, 25, 50, 75, 100, 0]


def test_open_and_closed_stages():
    for stage in ("new", "qualified", "proposal", "negotiation"):
        assert rules.is_open(stage) and not rules.is_closed(stage)
    for stage in ("won", "lost"):
        assert rules.is_closed(stage) and not rules.is_open(stage)


def test_late_only_when_open_and_close_date_before_today():
    yesterday = date(2026, 11, 23)
    assert rules.is_late("proposal", yesterday, TODAY)
    assert not rules.is_late("proposal", TODAY, TODAY)
    assert not rules.is_late("proposal", date(2026, 12, 1), TODAY)
    assert not rules.is_late("won", yesterday, TODAY)
    assert not rules.is_late("lost", yesterday, TODAY)


def test_never_late_without_a_close_date():
    assert not rules.is_late("new", None, TODAY)


def test_expected_revenue_counts_open_deals_only():
    deals = [
        {"stage": "new", "value_cents": 1_000_000, "probability": 10},
        {"stage": "negotiation", "value_cents": 2_000_000, "probability": 75},
        {"stage": "won", "value_cents": 9_000_000, "probability": 100},
        {"stage": "lost", "value_cents": 5_000_000, "probability": 0},
    ]
    assert rules.expected_revenue_cents(deals) == 100_000 + 1_500_000


def test_expected_revenue_uses_hand_set_probability():
    deals = [{"stage": "proposal", "value_cents": 1_000_000, "probability": 90}]
    assert rules.expected_revenue_cents(deals) == 900_000


def test_expected_revenue_rounds_to_whole_cents():
    deals = [{"stage": "new", "value_cents": 333, "probability": 33}]
    assert rules.expected_revenue_cents(deals) == 110


def test_stage_change_text():
    assert rules.stage_change_text(None, "proposal") == "Created in Proposal"
    assert rules.stage_change_text("proposal", "negotiation") == "Moved from Proposal to Negotiation"


def test_furthest_funnel_stage_ignores_lost():
    assert rules.furthest_funnel_stage(["new", "qualified", "negotiation", "lost"]) == "negotiation"
    assert rules.furthest_funnel_stage(["lost"]) is None
    assert rules.furthest_funnel_stage(["proposal", "won"]) == "won"
