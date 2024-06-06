# Function to recursively find test files
function find_test_files() {
  local folder="$1"
  for file in "$folder"/*; do
    if [[ -d "$file" ]]; then
      # Recursively call the function for subfolders
      find_test_files "$file"
    elif [[ -f "$file" && "$file" =~ \.t\.sol$ ]]; then
      # Add found test files to an array (modify extension)
      test_files+=("$file")
    fi
  done
}

# Main script execution
test_files=()  # Empty array to store test file paths
find_test_files "test"  # Replace "tests" with your actual test folder name

# Check if any test files were found
if [[ ${#test_files[@]} -eq 0 ]]; then
  echo "No test files found."
  exit 1
fi

# Loop through the array and run snforge test for each file (modify command)
for file in "${test_files[@]}"; do
  forge test --match-path "$file"  # Replace with the appropriate command for your Solidity tests
done