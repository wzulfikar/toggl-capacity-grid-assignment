package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
)

const maxWeeklyHours = 168 // hours in a week

// parseWeeklyHours reads {"weeklyHours": n} and validates the value.
func parseWeeklyHours(body io.Reader) (float64, error) {
	var in struct {
		WeeklyHours *float64 `json:"weeklyHours"`
	}
	dec := json.NewDecoder(body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&in); err != nil {
		return 0, fmt.Errorf("invalid JSON body: %w", err)
	}
	if in.WeeklyHours == nil {
		return 0, errors.New("weeklyHours is required")
	}
	h := *in.WeeklyHours
	if math.IsNaN(h) || math.IsInf(h, 0) {
		return 0, errors.New("weeklyHours must be a finite number")
	}
	if h < 0 || h > maxWeeklyHours {
		return 0, fmt.Errorf("weeklyHours must be between 0 and %d", maxWeeklyHours)
	}
	return h, nil
}

// handleUpdatePerson serves PATCH /api/people/{id} with {"weeklyHours": n}.
func (s *server) handleUpdatePerson(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid person id"})
		return
	}

	hours, err := parseWeeklyHours(http.MaxBytesReader(w, r.Body, 1<<10))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	var p struct {
		ID          int     `json:"id"`
		Name        string  `json:"name"`
		WeeklyHours float64 `json:"weeklyHours"`
	}
	err = s.db.QueryRow(r.Context(),
		`UPDATE people SET weekly_hours = $1 WHERE id = $2 RETURNING id, name, weekly_hours::float8`,
		hours, id,
	).Scan(&p.ID, &p.Name, &p.WeeklyHours)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "person not found"})
		return
	}
	if err != nil {
		log.Printf("update person %d: %v", id, err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	writeJSON(w, http.StatusOK, p)
}
