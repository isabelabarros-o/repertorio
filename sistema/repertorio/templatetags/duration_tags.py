from django import template

register = template.Library()


@register.filter
def hhmm(value):
    """Format a timedelta or duration-like value as H:MM (hours:minutes).

    Accepts datetime.timedelta, strings like '1:30:00', or numeric seconds.
    """
    if value is None:
        return ''

    # If it's a timedelta
    try:
        from datetime import timedelta
        if isinstance(value, timedelta):
            total = int(value.total_seconds())
        else:
            # if it's a string like '1:30:00'
            s = str(value)
            parts = s.split(':')
            if len(parts) == 3:
                h, m, sec = parts
                total = int(h) * 3600 + int(m) * 60 + int(sec)
            elif len(parts) == 2:
                h, m = parts
                total = int(h) * 3600 + int(m) * 60
            else:
                # try numeric
                total = int(float(s))

        hours = total // 3600
        minutes = (total % 3600) // 60
        return f"{hours}:{minutes:02d}"
    except Exception:
        return str(value)
