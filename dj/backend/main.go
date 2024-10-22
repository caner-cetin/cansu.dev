package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/valyala/fastjson"
	"gorm.io/datatypes"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

// Model structs
type Album struct {
	ID             string `gorm:"primaryKey" json:"id"`
	Name           string `json:"name"`
	CoverExtension string `json:"cover_extension"`
}

type OptimizedCover struct {
	AlbumID string `json:"album_id"`
	Cover   string `json:"cover"`
}
type Track struct {
	ID                     string         `gorm:"primaryKey" json:"id"`
	VocalFolderPath        *string        `json:"vocalFolderPath"`
	InstrumentalFolderPath string         `json:"instrumentalFolderPath"`
	AlbumID                string         `json:"album_id"`
	TotalDuration          float64        `json:"total_duration"`
	VocalWaveform          datatypes.JSON `json:"vocalWaveform"`
	InstrumentalWaveform   datatypes.JSON `json:"instrumentalWaveform"`
	Info                   datatypes.JSON `json:"info"`
	Instrumental           bool           `json:"instrumental"`
	Tempo                  float64        `json:"tempo"`
	Key                    string         `json:"key"`
}
type ListeningHistory struct {
	TrackID    string    `json:"track_id"`
	AnonID     string    `json:"anon_id"`
	ListenedAt time.Time `json:"listened_at"`
}

type TrackResponse struct {
	ID                          string            `json:"id"`
	Cover                       string            `json:"cover"`
	Info                        TrackResponseInfo `json:"info"`
	SavedAlbumName              string            `json:"savedAlbumName"`
	CoverExtension              string            `json:"coverExtension"`
	SavedVocalFolderPath        string            `json:"savedVocalFolderPath"`
	SavedInstrumentalFolderPath string            `json:"savedInstrumentalFolderPath"`
}
type TrackResponseInfo struct {
	Title                string           `json:"title"`
	Artist               string           `json:"artist"`
	Album                string           `json:"album"`
	Length               float64          `json:"length"`
	Genre                string           `json:"genre"`
	VocalWaveform        *json.RawMessage `json:"vocalWaveform"`
	InstrumentalWaveform *json.RawMessage `json:"instrumentalWaveform"`
	Tempo                float64          `json:"tempo"`
	Instrumental         bool             `json:"instrumental"`
	Key                  string           `json:"key"`
}

type ArtistPhotos struct {
	Artist string `json:"artist"`
	Photo  []byte `json:"photo"`
}

var allowedOrigins = []string{
	`^https?://(.*\.)?cansu.dev(:\d+)?$`,
	`^https?://(.*\.)?localhost(:\d+)?$`,
}

func checkAllowedOrigin(r *http.Request, origin string) bool {
	if origin == "" {
		return false
	}
	// do the regex check
	for _, allowedOrigin := range allowedOrigins {
		if matched, _ := regexp.MatchString(allowedOrigin, origin); matched {
			return true
		}
	}
	return false
}

var S3 *s3.Client
var S3_BUCKET = "cansu-dev-dj"

func main() {
	to, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cfg, err := config.LoadDefaultConfig(to,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(os.Getenv("S3_ACCESS_KEY_ID"), os.Getenv("S3_ACCESS_KEY_SECRET"), "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		log.Fatal(err)
	}

	S3 = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", os.Getenv("S3_ACCOUNT_ID")))
	})
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable",
		"pgpool", os.Getenv("POSTGRESQL_USERNAME"), os.Getenv("POSTGRESQL_PASSWORD"), os.Getenv("POSTGRESQL_DB"), 5432)
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatal(err)
	}
	// Auto migrate the schema
	db.AutoMigrate(&Album{}, &Track{}, &ListeningHistory{}, &OptimizedCover{}, &ArtistPhotos{})
	createJSONIndexes(db)
	// Initialize router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowOriginFunc:  checkAllowedOrigin,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Origin", "X-Requested-With", "Content-Type", "Accept"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           30,
	}))

	// Routes
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
	r.Get("/health", healthCheck)
	r.Route("/admin/albums", func(r chi.Router) {
		r.Use(basicAuth)
		r.Post("/upload", createTrack)
	})
	r.Route("/albums", func(r chi.Router) {
		r.Get("/", getAlbums)
	})
	r.Route("/track", func(r chi.Router) {
		r.Post("/random", getRandomTrack)
		r.Get("/album/{albumID}", getAlbumTracks)
		r.Get("/{trackID}", getTrackFromID)
	})
	r.Route("/artist", func(r chi.Router) {
		r.Get("/photo", getArtistPhoto)
	})
	r.Post("/artists-albums", getArtistsAlbums)
	r.Get("/search", SearchAlbumIDs)

	// Start server
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "8080")
	}
	log.Println("Starting server on port", os.Getenv("PORT"))
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", os.Getenv("PORT")), r))
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "https://www.youtube.com/watch?v=NuXjeEC2XOA", http.StatusFound)
}

func basicAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if !ok || user != os.Getenv("UPLOAD_ADMIN_USERNAME") || pass != os.Getenv("UPLOAD_ADMIN_PASSWORD") {
			w.Header().Set("WWW-Authenticate", `Basic realm="Restricted"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type GetAlbumsResponse struct {
	Albums []Album `json:"albums"`
	Total  int64   `json:"total"`
}

func getAlbums(w http.ResponseWriter, r *http.Request) {
	var albums []Album
	page := r.URL.Query().Get("page")
	limit := r.URL.Query().Get("limit")

	if page == "" || limit == "" {
		http.Error(w, "Page and limit are required", http.StatusBadRequest)
		return
	}
	var count int64
	db.Model(&Album{}).Count(&count)

	db.Scopes(paginate(page, limit)).Find(&albums)

	json.NewEncoder(w).Encode(GetAlbumsResponse{
		Albums: albums,
		Total:  count,
	})
}

func paginate(page, limit string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		p, _ := strconv.Atoi(page)
		l, _ := strconv.Atoi(limit)
		offset := (p - 1) * l
		return db.Offset(offset).Limit(l)
	}
}

func getAlbumTracks(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "albumID")

	var album Album
	if err := db.First(&album, "id = ?", albumID).Error; err != nil {
		http.Error(w, "Album not found", http.StatusNotFound)
		return
	}
	query := `
		SELECT 
			t.id, 
			(t.info ->> 'Title') AS title,
			t.total_duration as duration
		FROM tracks t
		JOIN albums a ON a.id = t.album_id
		WHERE a.id = $1
		ORDER BY (t.info ->> 'Track')
	`
	rows, err := db.Raw(query, albumID).Rows()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tracks []map[string]interface{}
	for rows.Next() {
		var trackID string
		var title string
		var duration float64
		if err := rows.Scan(&trackID, &title, &duration); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		tracks = append(tracks, map[string]interface{}{
			"id":       trackID,
			"title":    title,
			"duration": duration,
		})
	}

	// Get and optimize the album cover
	var optimizedCover OptimizedCover
	var result = db.Where("album_id = ?", albumID).First(&optimizedCover)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		coverS3Key := fmt.Sprintf("%s/cover.jpg", album.Name)
		fmt.Println("Fetching cover image from S3:", coverS3Key)
		coverOriginal, err := S3.GetObject(context.TODO(), &s3.GetObjectInput{
			Bucket: aws.String(S3_BUCKET),
			Key:    aws.String(coverS3Key),
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("Error fetching cover image: %v", err), http.StatusInternalServerError)
			return
		}
		cover, err := optimizeImage(coverOriginal.Body)
		if err != nil {
			// If optimization fails, we'll continue without the cover
			fmt.Printf("Error optimizing cover for album %s: %v\n", album.ID, err)
		} else {
			optimizedCover = OptimizedCover{
				AlbumID: album.ID,
				Cover:   cover,
			}
			result = db.Create(&optimizedCover)
			if result.Error != nil {
				http.Error(w, result.Error.Error(), http.StatusInternalServerError)
				return
			}
		}
	}

	response := map[string]interface{}{
		"tracks": tracks,
		"cover":  optimizedCover.Cover,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func optimizeImage(img io.ReadCloser) (string, error) {
	// Create a temporary file
	tempFile, err := os.CreateTemp("", "image-*.tmp")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %v", err)
	}
	defer os.Remove(tempFile.Name()) // Clean up the temp file when we're done

	// Copy the image data to the temp file
	_, err = io.Copy(tempFile, img)
	if err != nil {
		return "", fmt.Errorf("failed to write to temp file: %v", err)
	}
	tempFile.Close() // Close the file so ImageMagick can access it

	outputFile, err := os.CreateTemp("", "optimized-*.jpg")
	if err != nil {
		return "", fmt.Errorf("failed to create output temp file: %v", err)
	}
	defer os.Remove(outputFile.Name()) // Clean up the output temp file when we're done
	outputFile.Close()                 // Close the file so ImageMagick can write to it

	cmd := exec.Command(
		"convert",
		tempFile.Name(),
		"-strip",
		"-quality", "85",
		"-resize", fmt.Sprintf("%dx>", 400),
		"-sampling-factor", "4:2:0",
		"-colorspace", "sRGB",
		"-interlace", "Plane",
		outputFile.Name(),
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to optimize image: %v: %s", err, stderr.String())
	}

	// Read the optimized image
	optimizedData, err := os.ReadFile(outputFile.Name())
	if err != nil {
		return "", fmt.Errorf("failed to read optimized image: %v", err)
	}

	return base64.StdEncoding.EncodeToString(optimizedData), nil
}
func getArtistsAlbums(w http.ResponseWriter, r *http.Request) {
	paged := r.URL.Query().Get("paged")
	var rows *sql.Rows
	var err error
	if paged == "true" {
		page, _ := strconv.Atoi(r.URL.Query().Get("page"))
		perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
		if page < 1 {
			page = 1
		}
		if perPage < 1 {
			perPage = 10
		}
		query := `
            WITH artist_albums AS (
                SELECT DISTINCT
                    (info ->> 'Artist') as artist,
                    (info ->> 'Genre') as genre,
                    a.id as album_id,
                    a.name as album_name
                FROM albums a
                JOIN tracks t ON t.album_id = a.id
            ),
            ranked_artist_albums AS (
                SELECT 
                    artist, 
                    genre, 
                    album_id, 
                    album_name,
                    ROW_NUMBER() OVER (ORDER BY artist, album_name) as row_num
                FROM artist_albums
            )
            SELECT 
                r.artist, 
                r.genre, 
                r.album_id, 
                r.album_name,
                (SELECT COUNT(DISTINCT t.id) 
                 FROM tracks t 
                 WHERE (info ->> 'Artist') = r.artist) as track_count
            FROM ranked_artist_albums r
            WHERE r.row_num BETWEEN $1 AND $2
            ORDER BY r.artist, r.album_name;
        `
		start := (page-1)*perPage + 1
		end := page * perPage
		rows, err = db.Raw(query, start, end).Rows()
	} else if paged == "false" {
		var albumIds []string
		if err := json.NewDecoder(r.Body).Decode(&albumIds); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if len(albumIds) == 0 {
			http.Error(w, "No album IDs provided", http.StatusBadRequest)
			return
		}
		placeholders := make([]string, len(albumIds))
		for i := range albumIds {
			placeholders[i] = fmt.Sprintf("$%d", i+1)
		}
		placeholderString := strings.Join(placeholders, ",")

		// The SQL query
		query := fmt.Sprintf(`
		WITH artist_albums AS (
		SELECT DISTINCT
			(info ->> 'Artist') as artist,
			(info ->> 'Genre') as genre,
			a.id as album_id,
			a.name as album_name
		FROM albums a
		JOIN tracks t ON t.album_id = a.id
		WHERE a.id IN (%s)
		)
		SELECT
		aa.artist,
		aa.genre,
		aa.album_id,
		aa.album_name,
		(SELECT COUNT(DISTINCT t.id)
		FROM tracks t
		WHERE (info ->> 'Artist') = aa.artist) as track_count
		FROM artist_albums aa
		ORDER BY aa.artist, aa.album_name
		`, placeholderString)
		args := make([]interface{}, len(albumIds))
		for i, v := range albumIds {
			args[i] = v
		}

		// Execute the query
		rows, err = db.Raw(query, args...).Rows()
	} else {
		http.Error(w, "Pagination parameter is required", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var artist string
		var albumID uuid.UUID
		var albumName string
		var genre sql.NullString
		var trackCount int
		if err := rows.Scan(&artist, &genre, &albumID, &albumName, &trackCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		result := map[string]interface{}{
			"artist":      artist,
			"album_id":    albumID,
			"album_name":  albumName,
			"track_count": trackCount,
		}
		if genre.Valid {
			result["genre"] = genre.String
		} else {
			result["genre"] = nil
		}
		results = append(results, result)
	}

	json.NewEncoder(w).Encode(results)
}

func getArtistPhoto(w http.ResponseWriter, r *http.Request) {
	artistName := r.URL.Query().Get("name")
	if artistName == "" {
		http.Error(w, "Artist name is required", http.StatusBadRequest)
		return
	}
	var photo ArtistPhotos
	if err := db.First(&photo, "artist = ?", artistName).Error; err == nil {
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write(photo.Photo)
	} else {
		hyphenArtistName := strings.ReplaceAll(artistName, " ", "-")
		var target = "https://open.spotify.com/get_access_token?reason=transport&productType=web_player"
		req, err := http.NewRequest("GET", target, nil)
		if err != nil {
			http.Error(w, "Error creating request", http.StatusInternalServerError)
			return
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:129.0) Gecko/20100101 Firefox/129.0")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, "Error sending request", http.StatusInternalServerError)
			return
		}
		var tokenResponse map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
			http.Error(w, "Error decoding response", http.StatusInternalServerError)
			return
		}
		var token, ok = tokenResponse["accessToken"].(string)
		if !ok {
			http.Error(w, "Error getting access token", http.StatusInternalServerError)
			return
		}
		target = fmt.Sprintf("https://api.spotify.com/v1/search?type=artist&q=%s&decorate_restrictions=false&best_match=true&include_external=audio&limit=1", strings.Trim(hyphenArtistName, "\""))
		log.Default().Println(target)
		req, err = http.NewRequest("GET", target, nil)
		if err != nil {
			http.Error(w, "Error creating request", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Authorization", "Bearer "+token)
		resp.Body.Close()
		resp, err = http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, "Error sending request", http.StatusInternalServerError)
			return
		}
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Error reading response body", http.StatusInternalServerError)
			return
		}
		if resp.StatusCode > 399 {
			http.Error(w, fmt.Sprintf("Error getting artist info: %s", string(body)), http.StatusInternalServerError)
			return
		}
		var jp fastjson.Parser
		v, err := jp.Parse(string(body))
		if err != nil {
			http.Error(w, "Error parsing response body", http.StatusInternalServerError)
			return
		}
		artistUri := v.GetArray("artists", "items")[0].GetArray("images")[1].Get("url")
		w.Header().Set("Content-Type", "image/jpeg")
		req, err = http.NewRequest("GET", string(artistUri.GetStringBytes()), nil)
		if err != nil {
			http.Error(w, "Error creating request", http.StatusInternalServerError)
			return
		}
		resp.Body.Close()
		resp, err = http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, "Error sending request", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()
		cmd := exec.Command("convert", "-", "-resize", "200x200", "jpeg:-")
		var out bytes.Buffer
		cmd.Stdin = resp.Body
		cmd.Stdout = &out
		if err := cmd.Run(); err != nil {
			http.Error(w, "Error running convert command", http.StatusInternalServerError)
			return
		}
		photo = ArtistPhotos{
			Artist: artistName,
			Photo:  out.Bytes(),
		}
		if err := db.Create(&photo).Error; err != nil {
			http.Error(w, "Error saving photo", http.StatusInternalServerError)
			return
		}
		w.Write(out.Bytes())
	}
}
func getTrackFromID(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "trackID")
	var track Track
	if err := db.First(&track, "id = ?", trackID).Error; err != nil {
		http.Error(w, "Track not found", http.StatusNotFound)
		return
	}

	var album Album
	if err := db.First(&album, "id = ?", track.AlbumID).Error; err != nil {
		http.Error(w, "Album not found", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(processTrackInfo(track, album, w))
}

func processTrackInfo(track Track, album Album, w http.ResponseWriter) TrackResponse {
	// Process track info
	var trackInfo map[string]interface{}
	json.Unmarshal(track.Info, &trackInfo)
	title, artist, albumInfo, genre := processInfoDict(trackInfo)

	instrPath := track.InstrumentalFolderPath
	var vocalWf datatypes.JSON
	var vocalFolderPath string
	if track.Instrumental {
		vocalWf = nil
		vocalFolderPath = ""
	} else {
		vocalWf = track.VocalWaveform
		vocalFolderPath = *track.VocalFolderPath
	}
	var vocalWfRaw json.RawMessage
	if vocalWf != nil {
		vocalWfRaw = json.RawMessage(vocalWf)
	}
	var instrumentalWfRaw json.RawMessage
	if track.InstrumentalWaveform != nil {
		instrumentalWfRaw = json.RawMessage(track.InstrumentalWaveform)
	}
	// pull cover from database if exists, if not, pull from s3
	var cover string
	var opt OptimizedCover
	var result = db.Table("optimized_covers").Where("album_id = ?", album.ID).First(&opt)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return TrackResponse{}
	}
	if result.RowsAffected == 0 {
		coverS3Key := fmt.Sprintf("%s/cover.jpg", album.Name)
		fmt.Println("Fetching cover image from S3:", coverS3Key)
		coverOriginal, err := S3.GetObject(context.TODO(), &s3.GetObjectInput{
			Bucket: aws.String(S3_BUCKET),
			Key:    aws.String(coverS3Key),
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("Error fetching cover image: %v", err), http.StatusInternalServerError)
			return TrackResponse{}
		}
		cover, err = optimizeImage(coverOriginal.Body)
		if err != nil {
			// If optimization fails, we'll continue without the cover
			fmt.Printf("Error optimizing cover for album %s: %v\n", album.ID, err)
		} else {
			optimizedCover := OptimizedCover{
				AlbumID: album.ID,
				Cover:   cover,
			}
			result = db.Create(&optimizedCover)
			if result.Error != nil {
				http.Error(w, result.Error.Error(), http.StatusInternalServerError)
				return TrackResponse{}
			}
		}
	} else {
		cover = opt.Cover
	}

	return TrackResponse{
		Info: TrackResponseInfo{
			Title:                title,
			Artist:               artist,
			Album:                albumInfo,
			Length:               track.TotalDuration,
			Genre:                genre,
			VocalWaveform:        &vocalWfRaw,
			InstrumentalWaveform: &instrumentalWfRaw,
			Tempo:                track.Tempo,
			Instrumental:         track.Instrumental,
			Key:                  track.Key,
		},
		Cover:                       cover,
		ID:                          track.ID,
		SavedAlbumName:              album.Name,
		CoverExtension:              album.CoverExtension,
		SavedVocalFolderPath:        vocalFolderPath,
		SavedInstrumentalFolderPath: instrPath,
	}
}
func getRandomTrack(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		AnonID string `json:"anonId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var track Track
	err := db.
		Joins("LEFT JOIN listening_histories ON tracks.id = listening_histories.track_id AND listening_histories.anon_id = ?", requestBody.AnonID).
		Where("listening_histories.track_id IS NULL").
		Order("RANDOM()").
		First(&track).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// If no unlistened tracks, clear listening history and get a random track
			db.Where("anon_id = ?", requestBody.AnonID).Delete(&ListeningHistory{})
			err = db.Order("RANDOM()").First(&track).Error
			if err != nil {
				http.Error(w, "No tracks found", http.StatusBadRequest)
				return
			}
		} else {
			http.Error(w, fmt.Sprintf("Error fetching random track: %v", err), http.StatusInternalServerError)
			return
		}
	}

	var album Album
	if err := db.First(&album, "id = ?", track.AlbumID).Error; err != nil {
		http.Error(w, "Album not found", http.StatusInternalServerError)
		return
	}

	// Create listening history
	db.Create(&ListeningHistory{
		TrackID:    track.ID,
		AnonID:     requestBody.AnonID,
		ListenedAt: time.Now(),
	})

	json.NewEncoder(w).Encode(processTrackInfo(track, album, w))
}

func createTrack(w http.ResponseWriter, r *http.Request) {
	var trackData []struct {
		Metadata               map[string]interface{} `json:"metadata"`
		Key                    string                 `json:"key"`
		Tempo                  float64                `json:"tempo"`
		Length                 float64                `json:"length"`
		InstrumentalFolderPath string                 `json:"instrumentalFolderPath"`
		Instrumental           bool                   `json:"instrumental"`
		VocalFolderPath        *string                `json:"vocalFolderPath"`
		InstrumentalWaveform   json.RawMessage        `json:"waveform"`
		VocalWaveform          json.RawMessage        `json:"vocalWaveform"`
	}

	if err := json.NewDecoder(r.Body).Decode(&trackData); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	for _, track := range trackData {

		var album Album
		albumName := track.Metadata["Album"].(string)
		if err := db.Where(Album{Name: albumName}).Attrs(Album{ID: uuid.NewString()}).FirstOrCreate(&album).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		metadataJSON, err := json.Marshal(track.Metadata)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		track := Track{
			ID:                     uuid.New().String(),
			AlbumID:                album.ID,
			Info:                   metadataJSON,
			Key:                    track.Key,
			Tempo:                  track.Tempo,
			Instrumental:           track.Instrumental,
			InstrumentalFolderPath: track.InstrumentalFolderPath,
			VocalFolderPath:        track.VocalFolderPath,
			InstrumentalWaveform:   datatypes.JSON(track.InstrumentalWaveform),
			VocalWaveform:          datatypes.JSON(track.VocalWaveform),
			TotalDuration:          track.Length}

		if err := db.Create(&track).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(track)
	}
}
func processInfoDict(info map[string]interface{}) (string, string, string, string) {
	title, _ := info["Title"].(string)
	artist, _ := info["Artist"].(string)
	album, _ := info["Album"].(string)
	genre, _ := info["Genre"].(string)

	if title == "" && artist == "" && album == "" && genre == "" {
		title, _ = info["Title"].(string)
		artist, _ = info["Artist"].(string)
		album, _ = info["Album"].(string)
		genre, _ = info["Genre"].(string)
	}

	return title, artist, album, genre
}

func SearchAlbumIDs(w http.ResponseWriter, r *http.Request) {
	var query = r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}
	var results []string
	var trackQuery = "select distinct album_id from tracks where (info ->> 'Title') like ? or (info ->> 'Artist') like ? or (info ->> 'Album') like ? or (info ->> 'Genre') like ?;"
	if err := db.Raw(trackQuery, "%"+query+"%", "%"+query+"%", "%"+query+"%", "%"+query+"%").Find(&results).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(results)
}

func createJSONIndexes(db *gorm.DB) error {
	// List of indexes to create
	indexes := []struct {
		name string
		sql  string
	}{
		{
			name: "idx_tracks_artist",
			sql:  "CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks((info ->> 'Artist'))",
		},
		{
			name: "idx_tracks_genre",
			sql:  "CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks((info ->> 'Genre'))",
		},
		{
			name: "idx_tracks_title",
			sql:  "CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks((info ->> 'Title'))",
		},
	}

	// Create each index
	for _, idx := range indexes {
		if err := db.Exec(idx.sql).Error; err != nil {
			return fmt.Errorf("failed to create index %s: %w", idx.name, err)
		}
		fmt.Printf("Index %s created or already exists\n", idx.name)
	}

	return nil
}
