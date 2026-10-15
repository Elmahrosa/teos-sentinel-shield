const COMMAND_COSTS = {
  scan: 5,
  'scan-banking': 5,
  'scan_banking': 5,
  deps: 5,
  ci: 5,
  github: 15,
  status: 0,
  credits: 0,
  feedback: 0,
  solana: 5,
  'scan-solana': 5,
  evm: 5,
  solanatoken: 5,
  diligence: 15,
  fullreport: 20,
  chat: 3,
  claude: 2,
  'claude-opus': 3,
};

const VALID_COMMANDS = new Set(Object.keys(COMMAND_COSTS));

function getCommandCost(command) {
  return COMMAND_COSTS[command] || 0;
}

function isValidCommand(command) {
  return VALID_COMMANDS.has(command.toLowerCase());
}

function getAllCommandCosts() {
  return COMMAND_COSTS;
}

module.exports = {
  COMMAND_COSTS,
  VALID_COMMANDS,
  getCommandCost,
  isValidCommand,
  getAllCommandCosts
};
