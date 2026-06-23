def match_role(user_skills: list, role_required_skills: list) -> dict:
    """
    Compare user skills against a role's required skills.
    Returns matched, missing, and percentage.
    """
    user_set     = {s.lower().strip() for s in user_skills}
    required_set = {s.lower().strip() for s in role_required_skills}

    matched = sorted(list(user_set & required_set))
    missing = sorted(list(required_set - user_set))

    pct = round((len(matched) / len(required_set)) * 100, 1) if required_set else 0.0

    return {
        "matched_skills":  matched,
        "missing_skills":  missing,
        "match_percentage": pct,
        "matched_count":   len(matched),
        "required_count":  len(required_set),
    }


def match_all_roles(user_skills: list, roles: list) -> list:
    """
    Match user skills against every role.
    Returns list sorted by match percentage descending.
    """
    results = []
    for role in roles:
        match = match_role(user_skills, role.required_skills)
        results.append({
            "role_id":         role.id,
            "role_name":       role.role_name,
            **match,
        })
    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return results
