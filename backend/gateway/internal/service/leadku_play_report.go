package service

import (
	"encoding/binary"
	"encoding/csv"
	"errors"
	"fmt"
	"github.com/coreasia/gateway/internal/model"
	"io"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf16"
)

var playReportName = regexp.MustCompile(`^installs_id\.coreasia\.leadku_[0-9]{6}_(?:overview|country)\.csv$`)

// Google Play CSV is the source for downloads and uninstalls. A mobile
// heartbeat is deliberately never used as a substitute for these numbers.
func ParseLeadkuPlayReport(name string, raw []byte) ([]model.LeadkuPlayDay, error) {
	if !playReportName.MatchString(name) {
		return nil, errors.New("Gunakan laporan instalasi LeadKu dengan dimensi overview atau country")
	}
	if len(raw) >= 2 && raw[0] == 0xff && raw[1] == 0xfe {
		if len(raw)%2 != 0 {
			return nil, errors.New("Laporan UTF-16 tidak lengkap")
		}
		u := make([]uint16, (len(raw)-2)/2)
		for i := range u {
			u[i] = binary.LittleEndian.Uint16(raw[2+i*2:])
		}
		raw = []byte(string(utf16.Decode(u)))
	}
	reader := csv.NewReader(strings.NewReader(strings.TrimPrefix(string(raw), "\ufeff")))
	reader.FieldsPerRecord = -1
	header, err := reader.Read()
	if err != nil {
		return nil, errors.New("Laporan kosong")
	}
	columns := map[string]int{}
	for i, h := range header {
		columns[strings.TrimSpace(h)] = i
	}
	for _, key := range []string{"Date", "Package Name", "Daily Device Installs", "Daily Device Uninstalls"} {
		if _, ok := columns[key]; !ok {
			return nil, fmt.Errorf("Kolom laporan tidak tersedia: %s", key)
		}
	}
	get := func(row []string, key string) string {
		idx, ok := columns[key]
		if !ok || idx >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[idx])
	}
	number := func(s string) (int64, error) {
		n, e := strconv.ParseInt(s, 10, 64)
		if e != nil || n < 0 || n > 1000000000 {
			return 0, errors.New("Jumlah instalasi tidak valid")
		}
		return n, nil
	}
	days := map[string]model.LeadkuPlayDay{}
	seen := map[string]bool{}
	rows := 0
	for {
		row, e := reader.Read()
		if e == io.EOF {
			break
		}
		if e != nil || len(row) != len(header) {
			return nil, errors.New("Baris laporan tidak lengkap")
		}
		rows++
		if rows > 100000 {
			return nil, errors.New("Laporan terlalu besar")
		}
		if get(row, "Package Name") != "id.coreasia.leadku" {
			return nil, errors.New("Laporan bukan untuk aplikasi LeadKu")
		}
		day := get(row, "Date")
		if _, e = time.Parse("2006-01-02", day); e != nil {
			return nil, errors.New("Tanggal laporan tidak valid")
		}
		key := day + ":" + get(row, "Country")
		if seen[key] {
			return nil, errors.New("Baris tanggal dan negara berulang")
		}
		seen[key] = true
		installs, e := number(get(row, "Daily Device Installs"))
		if e != nil {
			return nil, e
		}
		uninstalls, e := number(get(row, "Daily Device Uninstalls"))
		if e != nil {
			return nil, e
		}
		d := days[day]
		d.Day = day
		d.Source = name
		d.Installs += installs
		d.Uninstalls += uninstalls
		for _, field := range []struct {
			name   string
			target **int64
		}{{"Current Device Installs", &d.CurrentInstalls}, {"Installs on active devices", &d.ActiveInstalls}} {
			key := field.name
			if _, ok := columns[key]; !ok && key == "Installs on active devices" {
				key = "Active Device Installs"
			}
			if _, ok := columns[key]; ok {
				n, e := number(get(row, key))
				if e != nil {
					return nil, e
				}
				if *field.target == nil {
					*field.target = new(int64)
				}
				**field.target += n
			}
		}

		days[day] = d
	}
	if !strings.Contains(name, "_overview.csv") {
		if _, ok := columns["Country"]; !ok {
			return nil, errors.New("Laporan country tidak mempunyai kolom Country")
		}
	}
	result := make([]model.LeadkuPlayDay, 0, len(days))
	for _, d := range days {
		result = append(result, d)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Day < result[j].Day })
	if len(result) == 0 {
		return nil, errors.New("Laporan tidak mempunyai data")
	}
	return result, nil
}
