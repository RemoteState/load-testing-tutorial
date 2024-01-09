package main

import (
	"encoding/json"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	"net/http"
	"os"
	"time"
)

// Secret key for JWT
var jwtKey = []byte("your-secret-key")

// User struct for authentication
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// CustomClaims struct for JWT claims
type CustomClaims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

// HeartbeatHandler handles the heartbeat API
func HeartbeatHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Heartbeat OK"))
}

// LoginHandler handles the login API
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check username and password (in a real application, this would be against a database)
	if user.Username == "gaurav" && user.Password == "password" {
		expirationTime := time.Now().Add(5 * time.Minute)
		claims := &CustomClaims{
			Username: user.Username,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: expirationTime.Unix(),
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, err := token.SignedString(jwtKey)
		if err != nil {
			http.Error(w, "Error generating token", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(tokenString))
	} else {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
	}
}

// AuthenticatedHandler handles the authenticated API
func AuthenticatedHandler(w http.ResponseWriter, r *http.Request) {
	// Extract token from request headers
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, "Authorization header missing", http.StatusUnauthorized)
		return
	}

	// Validate token
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Check if token is valid and not expired
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		// Create and return JSON response
		response := map[string]string{
			"message": fmt.Sprintf("Hello, %s!", claims.Username),
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	} else {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
	}
}

func main() {
	r := mux.NewRouter()

	// Register handlers for each API
	r.HandleFunc("/heartbeat", HeartbeatHandler).Methods("GET")
	r.HandleFunc("/login", LoginHandler).Methods("POST")
	r.HandleFunc("/authenticated", AuthenticatedHandler).Methods("GET")

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server is running on port %s...\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), r)
}
