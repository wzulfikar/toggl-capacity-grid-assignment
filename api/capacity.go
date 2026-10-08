package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// maxWeeks bounds one request: thousands of people x two years of history.
const maxWeeks = 12

// parseRange snaps from back to its Monday and to forward to its Sunday, and
// returns the first Monday and the number of ISO weeks covered.
func parseRange(fromStr, toStr string) (start time.Time, weeks int, err error) {
	from, err := parseDate("from", fromStr)
	if err != nil {
		return time.Time{}, 0, err
	}
	to, err := parseDate("to", toStr)
	if err != nil {
		return time.Time{}, 0, err
	}
	if from.After(to) {
		return time.Time{}, 0, fmt.Errorf("from must not be after to")
	}

	start = from.AddDate(0, 0, -((int(from.Weekday()) + 6) % 7))
	end := to.AddDate(0, 0, (7-int(to.Weekday()))%7)
	weeks = (int(end.Sub(start).Hours()/24) + 1) / 7
	if weeks > maxWeeks {
		return time.Time{}, 0, fmt.Errorf("range is %d weeks, the maximum is %d", weeks, maxWeeks)
	}
	return start, weeks, nil
}

func parseDate(field, s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, fmt.Errorf("%s is required (YYYY-MM-DD)", field)
	}
	t, err := time.Parse(time.DateOnly, s)
	if err != nil {
		return time.Time{}, fmt.Errorf("%s must be a date as YYYY-MM-DD", field)
	}
	return t, nil
}

type personCapacity struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	WeeklyHours float64   `json:"weeklyHours"`
	Allocated   []float64 `json:"allocated"` // allocated[i] belongs to weeks[i]
}

type capacityResponse struct {
	From   string           `json:"from"`
	To     string           `json:"to"`
	Weeks  []string         `json:"weeks"`
	People []personCapacity `json:"people"`
}

// Allocation counts Mon-Fri only: each assignment contributes its weekday
// overlap with the week times hours_per_day. Every row is summed, since
// identical-looking rows are split allocations. The weeks series is built from
// integers so the planner estimates its size correctly and skips JIT.
const capacityQuery = `
WITH weeks AS (
  SELECT i, ($1::date + 7 * i) AS wk FROM generate_series(0, $2::int - 1) AS i
),
alloc AS (
  SELECT a.person_id, w.i,
         SUM(a.hours_per_day *
             GREATEST(0, LEAST(a.end_date, w.wk + 4) - GREATEST(a.start_date, w.wk) + 1)) AS hours
  FROM weeks w
  JOIN assignments a ON a.start_date <= w.wk + 4 AND a.end_date >= w.wk
  GROUP BY a.person_id, w.i
)
SELECT p.id, p.name, p.weekly_hours::float8,
       array_agg(COALESCE(al.hours, 0)::float8 ORDER BY w.i) AS allocated
FROM people p
CROSS JOIN weeks w
LEFT JOIN alloc al ON al.person_id = p.id AND al.i = w.i
GROUP BY p.id
ORDER BY p.name, p.id`

// handleCapacity serves GET /api/capacity?from=YYYY-MM-DD&to=YYYY-MM-DD
func (s *server) handleCapacity(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	start, weeks, err := parseRange(q.Get("from"), q.Get("to"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	rows, err := s.db.Query(r.Context(), capacityQuery, start, weeks)
	if err != nil {
		log.Printf("capacity: query: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	defer rows.Close()

	people := []personCapacity{}
	for rows.Next() {
		var p personCapacity
		if err := rows.Scan(&p.ID, &p.Name, &p.WeeklyHours, &p.Allocated); err != nil {
			log.Printf("capacity: scan: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
			return
		}
		people = append(people, p)
	}
	if err := rows.Err(); err != nil {
		log.Printf("capacity: rows: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	weekStarts := make([]string, weeks)
	for i := range weekStarts {
		weekStarts[i] = start.AddDate(0, 0, 7*i).Format(time.DateOnly)
	}
	writeJSON(w, http.StatusOK, capacityResponse{
		From:   start.Format(time.DateOnly),
		To:     start.AddDate(0, 0, 7*weeks-1).Format(time.DateOnly),
		Weeks:  weekStarts,
		People: people,
	})
}
