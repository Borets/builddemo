#!/bin/bash

# Build Performance Analysis Script
# Downloads artifacts and generates a comparison report

# Set the script to exit on error
set -e

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Text formatting
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for .env file
if [ ! -f .env ]; then
  echo -e "${YELLOW}No .env file found. Creating from example...${NC}"
  
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${YELLOW}Created .env from example. Please edit .env with your credentials before continuing.${NC}"
    exit 1
  else
    echo -e "${RED}No .env.example file found. Please create a .env file with your GitHub credentials.${NC}"
    exit 1
  fi
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed. Please install Node.js to use this script.${NC}"
  exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Parse arguments
LATEST=false
OUTPUT_DIR="."

while [[ $# -gt 0 ]]; do
  case $1 in
    --latest|-l)
      LATEST=true
      shift
      ;;
    --output|-o)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--latest|-l] [--output|-o OUTPUT_DIR]"
      exit 1
      ;;
  esac
done

# Download artifacts
echo -e "${BLUE}=== Downloading Build Artifacts ===${NC}"
if [ "$LATEST" = true ]; then
  node download-artifacts.js --latest --output "$OUTPUT_DIR"
else
  node download-artifacts.js --output "$OUTPUT_DIR"
fi

# Check if download was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to download artifacts. Please check your GitHub credentials and repository settings.${NC}"
  exit 1
fi

# Generate comparison report
echo -e "\n${BLUE}=== Generating Build Performance Report ===${NC}"
node compare-build-stats.js

# Save report to file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="build_performance_report_${TIMESTAMP}.txt"

echo -e "\n${GREEN}Saving report to ${REPORT_FILE}...${NC}"
node compare-build-stats.js > "$REPORT_FILE"

echo -e "\n${GREEN}Build performance analysis complete!${NC}"
echo -e "Report saved to: ${REPORT_FILE}"
echo -e "\nYou can view the report at any time with: cat ${REPORT_FILE}" 