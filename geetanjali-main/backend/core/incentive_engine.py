"""Incentive configuration defaults and calculation engine."""
from typing import List, Dict, Any

DEFAULT_CONFIG = {
    "id": "master",
    "staff_daily_tiers": [
        {"min": 2500, "max": 4999, "bonus": 100},
        {"min": 5000, "max": 7999, "bonus": 200},
        {"min": 8000, "max": 9999, "bonus": 350},
        {"min": 10000, "max": 14999, "bonus": 500},
        {"min": 15000, "max": 17999, "bonus": 700},
        {"min": 18000, "max": 99999999, "bonus": 1000},
    ],
    "video_review_bonus": 50,
    "staff_monthly_multipliers": [
        {"min_ratio": 4, "max_ratio": 5, "pct": 3},
        {"min_ratio": 5, "max_ratio": 6, "pct": 5},
        {"min_ratio": 6, "max_ratio": 9999, "pct": 6},
    ],
    "retail_commission_pct": 0,
    "product_incentives": [
        # L'Oreal Professionnel
        {"brand": "loreal", "brand_display": "L'Oréal Professionnel", "min_price": 1, "max_price": 2000, "amount": 50},
        {"brand": "loreal", "brand_display": "L'Oréal Professionnel", "min_price": 2001, "max_price": 4000, "amount": 100},
        {"brand": "loreal", "brand_display": "L'Oréal Professionnel", "min_price": 4001, "max_price": 999999, "amount": 150},
        # Kanpeki
        {"brand": "kanpeki", "brand_display": "Kanpeki", "min_price": 1, "max_price": 3000, "amount": 50},
        {"brand": "kanpeki", "brand_display": "Kanpeki", "min_price": 3001, "max_price": 999999, "amount": 100},
        # Kerastase
        {"brand": "kerastase", "brand_display": "Kérastase", "min_price": 1, "max_price": 3000, "amount": 50},
        {"brand": "kerastase", "brand_display": "Kérastase", "min_price": 3001, "max_price": 6000, "amount": 100},
        {"brand": "kerastase", "brand_display": "Kérastase", "min_price": 6001, "max_price": 9000, "amount": 150},
        {"brand": "kerastase", "brand_display": "Kérastase", "min_price": 9001, "max_price": 12000, "amount": 200},
        {"brand": "kerastase", "brand_display": "Kérastase", "min_price": 12001, "max_price": 999999, "amount": 250},
        # Olaplex
        {"brand": "olaplex", "brand_display": "Olaplex", "min_price": 1, "max_price": 3000, "amount": 50},
        {"brand": "olaplex", "brand_display": "Olaplex", "min_price": 3001, "max_price": 5000, "amount": 100},
        {"brand": "olaplex", "brand_display": "Olaplex", "min_price": 5001, "max_price": 999999, "amount": 150},
        # Kerafusion / De Fabulous
        {"brand": "de fabulous", "brand_display": "Kerafusion / De Fabulous", "min_price": 1, "max_price": 2000, "amount": 50},
        {"brand": "de fabulous", "brand_display": "Kerafusion / De Fabulous", "min_price": 2001, "max_price": 4000, "amount": 100},
        {"brand": "de fabulous", "brand_display": "Kerafusion / De Fabulous", "min_price": 4001, "max_price": 999999, "amount": 150},
        # Amazon Series
        {"brand": "amazon series", "brand_display": "Amazon Series", "min_price": 1, "max_price": 999999, "amount": 100},
        # QOD
        {"brand": "qod", "brand_display": "QOD", "min_price": 1, "max_price": 999999, "amount": 100},
    ],
    "gift_card_commission_pct": 3,
    "membership_commission_pct": 2,
    "package_commission_pct": 2,
    "manager_milestones": [
        {"min_revenue": 1800000, "bonus_per_manager": 5000},
        {"min_revenue": 2000000, "bonus_per_manager": 7000},
        {"min_revenue": 2500000, "bonus_per_manager": 10000},
        {"min_revenue": 3000000, "bonus_per_manager": 20000},
    ],
    "inventory": {
        "lead_time_days": 4,
        "safety_buffer_pct": 50,
    },
}


async def get_config() -> dict:
    """Retrieve default master config."""
    return DEFAULT_CONFIG


# -----------------------------------------------------------------------------
# SERVICE INCENTIVE ENGINE (ELIGIBLE SERVICE AMOUNT FORMULA)
# -----------------------------------------------------------------------------
# Formula:
#   Eligible Service Amount = MAX(0, Net Amount - (Paid from Value Card * 0.50))
#
# Shared Service Split:
#   Staff Eligible Value = Eligible Service Amount * (Staff Contribution % / 100)
#
# Daily Total Base:
#   Daily Eligible Service Total = Sum of all Staff Eligible Values for that business day
# -----------------------------------------------------------------------------

def calc_eligible_service_amount(net_amount: float, value_card_paid: float = 0.0) -> float:
    """
    Calculate Eligible Service Amount per line item.
    Formula: MAX(0, Net Amount - (Paid from Value Card * 50%))
    """
    net_val = float(net_amount or 0.0)
    vc_paid = max(0.0, float(value_card_paid or 0.0))
    eligible = net_val - (vc_paid * 0.50)
    return max(0.0, round(eligible, 2))


def calc_staff_eligible_value(eligible_service_amount: float, share_pct: float = 100.0) -> float:
    """
    Split Eligible Service Amount among contributing staff members.
    Formula: Staff Share Value = Eligible Service Amount * (Staff Contribution % / 100)
    """
    pct_frac = float(share_pct or 100.0) / 100.0
    return round(float(eligible_service_amount or 0.0) * pct_frac, 2)


def calc_daily_bonus(service_revenue: float, tiers: List[dict]) -> Dict[str, Any]:
    """
    Calculate daily bonus based on Daily Eligible Service Total and tier brackets.
    Evaluates strictly against Daily Eligible Service Total base (never raw Net Amount).
    """
    tier_hit = None
    total = float(service_revenue or 0.0)
    for t in sorted(tiers, key=lambda x: x["min"], reverse=True):
        if total >= t["min"]:
            tier_hit = t
            break
    return {
        "service_revenue": round(total, 2),
        "daily_eligible_service_total": round(total, 2),
        "tier": tier_hit,
        "bonus": tier_hit["bonus"] if tier_hit else 0,
    }


def calc_monthly_bonus(monthly_service_rev: float, salary: float, mults: List[dict]) -> Dict[str, Any]:
    """Calculate monthly efficiency bonus based on revenue-to-salary ratio."""
    if salary <= 0:
        return {"ratio": 0, "pct": 0, "amount": 0}
    ratio = monthly_service_rev / salary
    hit = None
    for m in sorted(mults, key=lambda x: x["min_ratio"], reverse=True):
        if ratio >= m["min_ratio"]:
            hit = m
            break
    return {
        "ratio": round(ratio, 2),
        "pct": hit["pct"] if hit else 0,
        "amount": round(monthly_service_rev * (hit["pct"] / 100), 2) if hit else 0,
    }


def calc_manager_bonus(month_revenue: float, milestones: List[dict]) -> Dict[str, Any]:
    """Calculate manager milestone bonus based on total salon revenue."""
    hit = None
    for m in sorted(milestones, key=lambda x: x["min_revenue"]):
        if month_revenue >= m["min_revenue"]:
            hit = m
    return {
        "month_revenue": round(month_revenue, 2),
        "milestone": hit,
        "bonus": hit["bonus_per_manager"] if hit else 0,
    }


def calc_product_incentive(item_name: str, brand: str, net_price: float, qty: float, rules: List[dict], mappings: Dict[str, dict] = None) -> float:
    """Find first matching rule and return per-unit incentive × qty."""
    if not item_name or qty <= 0:
        return 0.0
    item_key = item_name.strip().lower()
    if mappings and item_key in mappings:
        map_entry = mappings[item_key]
        return float(map_entry.get("amount", 0)) * qty

    name_lc = item_key
    brand_lc = (brand or "").lower()
    aliases = {
        "loreal": ["l'oreal", "loreal", "l'oreal professionnel", "loreal professionnel", "serie expert", "absolut repair", "metal dx", "aminexil", "serioxyl", "vitamino", "inoa", "majirel"],
        "kanpeki": ["kanpeki", "kenpeki"],
        "kerastase": ["kerastase", "kérastase", "k chroma", "k genesis", "k reflection", "k nutritive", "k specifique", "k densifique", "k blond", "k discipline", "k resistance", "k elixir", "k initialiste", "k symbiose", "k first", " keras", "elixir ultime"],
        "olaplex": ["olaplex", "bond maintenance"],
        "de fabulous": ["de fabulous", "kerafusion"],
        "amazon series": ["amazon", "amazone", "amazon series", "amazone series"],
        "qod": ["qod"],
    }
    unit_price = net_price / qty if qty else 0
    for rule in rules:
        rb = (rule.get("brand") or "").lower()
        if rb:
            hit = rb in name_lc or rb in brand_lc
            if not hit:
                for a in aliases.get(rb, []):
                    if a in name_lc:
                        hit = True
                        break
            if not hit:
                continue
        pat = (rule.get("pattern") or "").lower()
        if pat:
            pat_aliases = {"shampoo": ["shmp", "shampooing"], "masque": ["mask", "masq"],
                            "conditioner": ["cond"], "serum": ["srm"]}
            hit_pat = pat in name_lc
            if not hit_pat:
                for a in pat_aliases.get(pat, []):
                    if a in name_lc:
                        hit_pat = True
                        break
            if not hit_pat:
                continue
        mn = rule.get("min_price")
        mx = rule.get("max_price")
        if mn is not None and unit_price < mn:
            continue
        if mx is not None and unit_price > mx:
            continue
        return float(rule.get("amount", 0)) * qty
    return 0.0


async def staff_day_product_incentive(staff_name: str, day: str, rules: List[dict]) -> float:
    """Incentives disabled - return 0.0"""
    return 0.0
