package main

import (
	"strings"
	"testing"
)

func TestParseRange(t *testing.T) {
	tests := []struct {
		name      string
		from, to  string
		wantStart string
		wantWeeks int
		wantErr   string
	}{
		{"one week Mon to Sun", "2026-01-05", "2026-01-11", "2026-01-05", 1, ""},
		{"friday to snaps to sunday", "2025-12-29", "2026-01-16", "2025-12-29", 3, ""},
		{"sunday from snaps back 6 days", "2026-01-04", "2026-01-11", "2025-12-29", 2, ""},
		{"from after to", "2026-01-16", "2025-12-29", "", 0, "from must not be after to"},
		{"bad date", "nope", "2026-01-16", "", 0, "from"},
		{"bad to date", "2026-01-05", "2026-13-40", "", 0, "to"},
		{"missing from", "", "2026-01-16", "", 0, "from is required"},
		{"missing to", "2026-01-05", "", "", 0, "to is required"},
		{"exactly 12 weeks", "2026-01-05", "2026-03-29", "2026-01-05", 12, ""},
		{"13 weeks", "2026-01-05", "2026-04-05", "", 0, "maximum is 12"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			start, weeks, err := parseRange(tt.from, tt.to)
			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Fatalf("err = %v, want containing %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got := start.Format("2006-01-02"); got != tt.wantStart || weeks != tt.wantWeeks {
				t.Fatalf("got %s, %d weeks; want %s, %d", got, weeks, tt.wantStart, tt.wantWeeks)
			}
		})
	}
}
