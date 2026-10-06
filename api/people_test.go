package main

import (
	"strings"
	"testing"
)

func TestParseWeeklyHours(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		want    float64
		wantErr bool
	}{
		{"valid", `{"weeklyHours":32}`, 32, false},
		{"decimal", `{"weeklyHours":37.5}`, 37.5, false},
		{"zero", `{"weeklyHours":0}`, 0, false},
		{"max", `{"weeklyHours":168}`, 168, false},
		{"negative", `{"weeklyHours":-1}`, 0, true},
		{"too large", `{"weeklyHours":169}`, 0, true},
		{"missing", `{}`, 0, true},
		{"string value", `{"weeklyHours":"32"}`, 0, true},
		{"unknown field", `{"weeklyHours":32,"name":"x"}`, 0, true},
		{"malformed", `{"weeklyHours":`, 0, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseWeeklyHours(strings.NewReader(tt.body))
			if (err != nil) != tt.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, tt.wantErr)
			}
			if err == nil && got != tt.want {
				t.Fatalf("got %v, want %v", got, tt.want)
			}
		})
	}
}
