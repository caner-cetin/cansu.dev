package internal

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"unicode"

	"github.com/rs/zerolog/log"
)

func OpenFile(input string) (*os.File, error) {
	f, err := os.Open(input)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("path does not exist: %w", err)
		}
		return nil, fmt.Errorf("unknown error while opening file: %w", err)
	}
	return f, nil
}

func ReadFile(input string) ([]byte, error) {
	file, err := OpenFile(input)
	if err != nil {
		return nil, fmt.Errorf("error while opening file: %w", err)
	}
	defer file.Close()
	contents, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("error reading contents of %s: %w", input, err)
	}
	return contents, nil
}

func RemoveAllNonDigit(input string) string {
	var result strings.Builder
	for _, char := range input {
		if unicode.IsDigit(char) {
			result.WriteRune(char)
		}
	}
	return result.String()
}

// OpenURL opens the specified URL in the system's default web browser.
// It supports Windows, macOS (darwin), Linux, and other Unix-like operating systems.
// For Windows Subsystem for Linux (WSL), it uses the Windows browser through cmd.exe.
// For other Linux/Unix systems, it uses xdg-open.
//
// https://stackoverflow.com/questions/39320371/how-start-web-server-to-open-page-in-browser-in-golang
func OpenURL(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default: // "linux", "freebsd", "openbsd", "netbsd"
		// Check if running under WSL
		if isWSL() {
			// Use 'cmd.exe /c start' to open the URL in the default Windows browser
			cmd = "cmd.exe"
			args = []string{"/c", "start", url}
		} else {
			// Use xdg-open on native Linux environments
			cmd = "xdg-open"
			args = []string{url}
		}
	}
	if len(args) > 1 {
		// args[0] is used for 'start' command argument, to prevent issues with URLs starting with a quote
		args = append(args[:1], append([]string{""}, args[1:]...)...)
	}
	err := exec.Command(cmd, args...).Start()
	if err != nil {
		return fmt.Errorf("error executing %s %s: %w", cmd, strings.Join(args, ","), err)
	}
	return nil
}

// isWSL checks if the Go program is running inside Windows Subsystem for Linux
func isWSL() bool {
	releaseData, err := exec.Command("uname", "-r").Output()
	if err != nil {
		return false
	}
	return strings.Contains(strings.ToLower(string(releaseData)), "microsoft")
}

// PromptFor displays a message to the user and returns the user's input as a string.
// It reads the input from standard input until a newline character is encountered.
func PromptFor(message string) (string, error) {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print(message)
	text, err := reader.ReadString('\n')
	if err != nil {
		return "", fmt.Errorf("failed to read user input: %w", err)
	}
	text = strings.TrimSpace(text)
	return text, nil
}

// PromptForPickFromSlice prompts the user to select an item from a slice by displaying a message
// and returning the selected item. It accepts a generic type parameter T.
//
// Parameters:
//   - message: The prompt message to display to the user
//   - slice: A slice of type T from which the user will select an item
//
// Returns:
//   - T: The selected item from the slice
//   - int: index of selected item
//   - error: An error if:
//   - The user input could not be obtained
//   - The input is not a valid number
//   - The selected index is out of bounds
func PromptForPickFromSlice[T any](message string, slice []T) (T, int, error) {
	choice_str, err := PromptFor(message)
	if err != nil {
		var zero T
		return zero, 0, fmt.Errorf("failed to prompt user: %s", choice_str)
	}
	choice, err := strconv.Atoi(choice_str)
	if err != nil {
		var zero T
		return zero, 0, fmt.Errorf("invalid number input")
	}
	if choice >= len(slice) {
		var zero T
		return zero, 0, fmt.Errorf("choice is not in list")
	}
	return slice[choice], choice, nil
}

// CloseReader safely closes an io.ReadCloser and logs any errors that occur during closure.
func CloseReader(r io.ReadCloser) {
	if cerr := r.Close(); cerr != nil {
		log.Error().Err(fmt.Errorf("error closing reader: %w", cerr)).Send()
	}
}
