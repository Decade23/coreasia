package service

import (
	"strings"
	"testing"
)

func TestLeadkuPlayCountryReportAndWrongApp(t *testing.T) {
	raw := "Date,Package Name,Country,Daily Device Installs,Daily Device Uninstalls,Active Device Installs\n2026-11-04,id.coreasia.leadku,ID,3,1,20\n2026-11-04,id.coreasia.leadku,SG,2,0,4\n"
	days, err := ParseLeadkuPlayReport("installs_id.coreasia.leadku_202611_country.csv", []byte(raw))
	if err != nil || len(days) != 1 || days[0].Installs != 5 || days[0].Uninstalls != 1 || days[0].ActiveInstalls == nil || *days[0].ActiveInstalls != 24 {
		t.Fatalf("bad totals: %+v %v", days, err)
	}
	for _, bad := range []string{strings.ReplaceAll(raw, "id.coreasia.leadku", "another.app"), raw + "2026-11-04,id.coreasia.leadku,ID,1,0,2\n", strings.ReplaceAll(raw, ",3,1,", ",-3,1,")} {
		if _, err := ParseLeadkuPlayReport("installs_id.coreasia.leadku_202611_country.csv", []byte(bad)); err == nil {
			t.Fatal("invalid report accepted")
		}
	}
	if _, err = ParseLeadkuPlayReport("installs_another.app_202611_country.csv", []byte(raw)); err == nil {
		t.Fatal("wrong application filename accepted")
	}
}
