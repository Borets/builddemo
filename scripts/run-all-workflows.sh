#!/bin/bash

# Run All Build Performance Workflows
# Triggers all build performance workflows using GitHub CLI

# Set the script to exit on error
set -e

# Text formatting
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
  echo -e "${RED}GitHub CLI (gh) is not installed. Please install the GitHub CLI to use this script.${NC}"
  echo -e "Installation instructions: https://cli.github.com/manual/installation"
  exit 1
fi

# Check if authenticated with GitHub
if ! gh auth status &> /dev/null; then
  echo -e "${RED}You are not authenticated with GitHub CLI.${NC}"
  echo -e "Please run 'gh auth login' first."
  exit 1
fi

echo -e "${BLUE}=== Running All Build Performance Workflows ===${NC}"

# Get GitHub repository
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

if [ -z "$REPO" ]; then
  echo -e "${YELLOW}Could not determine current repository.${NC}"
  
  # Prompt for repository
  read -p "Enter GitHub repository (owner/repo): " REPO
  
  if [ -z "$REPO" ]; then
    echo -e "${RED}No repository specified. Exiting.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Using repository: ${REPO}${NC}"

# List of workflows to run
WORKFLOWS=(
  "ci.yml"
  "ci-nocache.yml"
  "render-like-build.yml"
  "render-like-build-nocache.yml"
)

# Trigger each workflow
for workflow in "${WORKFLOWS[@]}"; do
  echo -e "\n${YELLOW}Triggering workflow: ${workflow}${NC}"
  
  if gh workflow run "$workflow" --repo "$REPO"; then
    echo -e "${GREEN}Successfully triggered ${workflow}${NC}"
  else
    echo -e "${RED}Failed to trigger ${workflow}${NC}"
  fi
done

echo -e "\n${BLUE}=== Workflow Summary ===${NC}"
echo -e "${GREEN}Triggered ${#WORKFLOWS[@]} workflows:${NC}"

for workflow in "${WORKFLOWS[@]}"; do
  echo -e "- ${workflow}"
done

echo -e "\n${YELLOW}View workflow runs:${NC}"
echo -e "https://github.com/${REPO}/actions"
echo -e "\n${GREEN}Done!${NC}" 