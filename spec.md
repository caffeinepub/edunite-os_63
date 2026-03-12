# EdUnite OS – Sprint 5: Timetable Full Integration

## Current State
- Timetable page exists with weekly period grid and inline editing
- Room assignment per cell exists
- No A/B day rotation support
- Timetable feeds Today's Class (current period name) and Behavior form (period auto-fill)
- No bell schedule variants or schedule type selection

## Requested Changes (Diff)

### Add
- A/B Day rotation mode toggle in Timetable settings (Week A / Week B schedules)
- Schedule type selector: Regular Day, Block Day, Half Day (applies to current week)
- Current week A/B indicator in Timetable header
- Today's Class briefing strip shows current schedule type and A/B week indicator
- Settings panel in Timetable for school day config (school name, day start/end)

### Modify
- TimetableData schema extended to support scheduleMode: 'standard' | 'ab', weekAAssignments, weekBAssignments
- Today's Class to read A/B rotation when computing current period/class
- Behavior form period auto-fill respects A/B rotation
- Timetable header shows which week (A or B) is currently active with a toggle

### Remove
- Nothing removed

## Implementation Plan
1. Extend TimetableData type with scheduleMode and weekA/weekB assignments
2. Update Timetable.tsx to show A/B toggle in header, render Week A or B grid based on selection
3. Add "Current Week" toggle (A or B) stored in localStorage
4. Update getCurrentPeriodName() in Classes.tsx to respect A/B rotation
5. Show A/B week badge in Today's Class briefing strip
6. Add schedule day type (Regular/Block/Half Day) per-day override
